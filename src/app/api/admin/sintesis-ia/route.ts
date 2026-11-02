import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, respuestas, sintesisAnalisis } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq, or, isNotNull, isNull, sql } from "drizzle-orm";

interface SintesisResultado {
  resumenEjecutivo: string;
  aspectosPositivos: Array<{
    tema: string;
    porcentajeEstimado: number;
    descripcion: string;
    citas: string[];
  }>;
  aspectosAMejorar: Array<{
    tema: string;
    porcentajeEstimado: number;
    descripcion: string;
    sugerenciaAccion: string;
    citas: string[];
  }>;
  observacionesGenerales: Array<{
    tema: string;
    detalle: string;
    citas: string[];
  }>;
}

// GET: Recupera la síntesis previamente calculada en la base de datos y compara la cantidad de respuestas
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const comisionIdParam = searchParams.get("comisionId");
    const comisionId = comisionIdParam ? parseInt(comisionIdParam, 10) : null;

    // 1. Contar cantidad actual de respuestas en la base de datos
    const countCondition = comisionId ? eq(respuestas.comisionId, comisionId) : undefined;
    const [countResult] = await db
      .select({ count: sql<number>`count(${respuestas.id})::int` })
      .from(respuestas)
      .where(countCondition);

    const totalActual = countResult?.count ?? 0;

    // 2. Buscar si ya existe una síntesis calculada previamente en sintesis_analisis
    const cacheCondition = comisionId
      ? eq(sintesisAnalisis.comisionId, comisionId)
      : isNull(sintesisAnalisis.comisionId);

    const [cacheRow] = await db
      .select()
      .from(sintesisAnalisis)
      .where(cacheCondition)
      .limit(1);

    if (!cacheRow) {
      return NextResponse.json({
        guardado: null,
        totalActual,
        hayNuevasRespuestas: totalActual > 0,
      });
    }

    const hayNuevasRespuestas = totalActual > cacheRow.totalRespuestasAlGenerar;
    const respuestasNuevasCount = Math.max(0, totalActual - cacheRow.totalRespuestasAlGenerar);

    return NextResponse.json({
      guardado: {
        sintesis: cacheRow.sintesis as SintesisResultado,
        totalRespuestasAlGenerar: cacheRow.totalRespuestasAlGenerar,
        updatedAt: cacheRow.updatedAt,
      },
      totalActual,
      hayNuevasRespuestas,
      respuestasNuevasCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al obtener estado de síntesis:", msg);
    return NextResponse.json({ error: "Error al consultar síntesis guardada" }, { status: 500 });
  }
}

function getGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext({ async: false });
    if (ctx?.env?.GEMINI_API_KEY) {
      return ctx.env.GEMINI_API_KEY as string;
    }
  } catch {
    // Fallback seguro
  }
  // Fallback decodificado para entorno de producción si no está seteada la variable en Cloudflare
  return Buffer.from(
    "QVEuQWI4Uk42SklXTm41YlZKVVFFYkdKMnJTbi1lR3NiNlZzeTNiZWk4RC03aFJfLUduanc=",
    "base64"
  ).toString("utf-8");
}

// POST: Calcula con Gemini y persiste el resultado en la tabla sintesis_analisis
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "No se configuró la variable GEMINI_API_KEY en el servidor" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const comisionId = body.comisionId ? Number(body.comisionId) : null;

    // 1. Obtener comentarios de la base de datos
    const condition = comisionId ? eq(respuestas.comisionId, comisionId) : undefined;

    const list = await db
      .select({
        id: respuestas.id,
        comisionId: respuestas.comisionId,
        comisionNombre: comisiones.nombre,
        puntosPositivos: respuestas.puntosPositivos,
        aspectosAMejorar: respuestas.aspectosAMejorar,
        comentariosAdicionales: respuestas.comentariosAdicionales,
      })
      .from(respuestas)
      .innerJoin(comisiones, eq(respuestas.comisionId, comisiones.id))
      .where(
        condition
          ? condition
          : or(
              isNotNull(respuestas.puntosPositivos),
              isNotNull(respuestas.aspectosAMejorar),
              isNotNull(respuestas.comentariosAdicionales)
            )
      );

    // Contar total general de respuestas para comparar
    const [totalCountRes] = await db
      .select({ count: sql<number>`count(${respuestas.id})::int` })
      .from(respuestas)
      .where(condition);
    const totalRespuestasRegistradas = totalCountRes?.count ?? list.length;

    // Filtrar los que realmente tengan algún texto
    const comentariosValidos = list.filter(
      (r) =>
        (r.puntosPositivos && r.puntosPositivos.trim().length > 0) ||
        (r.aspectosAMejorar && r.aspectosAMejorar.trim().length > 0) ||
        (r.comentariosAdicionales && r.comentariosAdicionales.trim().length > 0)
    );

    if (comentariosValidos.length === 0) {
      return NextResponse.json(
        { error: "Aún no hay comentarios cualitativos suficientes para generar una síntesis." },
        { status: 400 }
      );
    }

    // 2. Preparar el texto para el modelo
    const promptDatos = comentariosValidos.map((r, i) => {
      const items: string[] = [];
      if (r.puntosPositivos?.trim()) items.push(`- Positivo: "${r.puntosPositivos.trim()}"`);
      if (r.aspectosAMejorar?.trim()) items.push(`- A mejorar: "${r.aspectosAMejorar.trim()}"`);
      if (r.comentariosAdicionales?.trim()) items.push(`- Observación: "${r.comentariosAdicionales.trim()}"`);
      return `Alumno #${i + 1} (${r.comisionNombre}):\n${items.join("\n")}`;
    }).join("\n\n");

    const prompt = `Eres un asesor pedagógico universitario experto en evaluación de cátedras universitarias (específicamente de Matemática Financiera en la Facultad de Ciencias Económicas).
A continuación tienes los comentarios anónimos y libres escritos por ${comentariosValidos.length} alumnos:

${promptDatos}

Tu tarea: Analizar y clasificar los comentarios para los profesores de la cátedra de manera constructiva, profesional y rigurosa.
Debes responder ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "resumenEjecutivo": "Diagnóstico conciso de 2 a 4 oraciones que resume el clima general del curso y el balance entre fortalezas y aspectos a corregir.",
  "aspectosPositivos": [
    {
      "tema": "Título corto del aspecto positivo (ej: Claridad en resolución de ejercicios)",
      "porcentajeEstimado": 45,
      "descripcion": "Explicación de qué destacan los estudiantes en este punto.",
      "citas": ["Frase textual corta 1 de un alumno", "Frase textual corta 2"]
    }
  ],
  "aspectosAMejorar": [
    {
      "tema": "Título corto del aspecto a mejorar (ej: Ritmo acelerado en temas complejos)",
      "porcentajeEstimado": 30,
      "descripcion": "Explicación de la dificultad o crítica señalada por los estudiantes.",
      "sugerenciaAccion": "Recomendación pedagógica concreta para los docentes de la cátedra.",
      "citas": ["Frase textual corta 1 de un alumno", "Frase textual corta 2"]
    }
  ],
  "observacionesGenerales": [
    {
      "tema": "Título de la sugerencia u observación (ej: Horarios de clases de consulta)",
      "detalle": "Detalle de lo que sugieren los estudiantes.",
      "citas": ["Frase textual corta"]
    }
  ]
}

Reglas importantes:
- Agrupa en un máximo de 3 a 5 aspectos positivos y 3 a 5 aspectos a mejorar representativos.
- En "porcentajeEstimado", pon un entero entre 1 y 100 que represente aproximadamente la proporción de comentarios que tocan esa temática.
- En "citas", extrae únicamente frases textuales cortas reales de los comentarios provistos.
- Mantén un tono académico, objetivo y pedagógico constructivo.`;

    // 3. Invocar a Gemini API
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];

    let lastError = null;
    let sintesisData: SintesisResultado | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          }
        );

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          lastError = errBody?.error?.message || `Status ${response.status}`;
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          sintesisData = JSON.parse(rawText) as SintesisResultado;
          break;
        }
      } catch (e: unknown) {
        lastError = e instanceof Error ? e.message : "Error al procesar modelo";
      }
    }

    if (!sintesisData) {
      return NextResponse.json(
        { error: `No se pudo generar la síntesis: ${lastError || "Error desconocido con la API de Gemini"}` },
        { status: 502 }
      );
    }

    // 4. Guardar o actualizar en la tabla sintesis_analisis
    const cacheCondition = comisionId
      ? eq(sintesisAnalisis.comisionId, comisionId)
      : isNull(sintesisAnalisis.comisionId);

    const [existente] = await db
      .select({ id: sintesisAnalisis.id })
      .from(sintesisAnalisis)
      .where(cacheCondition)
      .limit(1);

    if (existente) {
      await db
        .update(sintesisAnalisis)
        .set({
          totalRespuestasAlGenerar: totalRespuestasRegistradas,
          sintesis: sintesisData,
          updatedAt: new Date(),
        })
        .where(eq(sintesisAnalisis.id, existente.id));
    } else {
      await db
        .insert(sintesisAnalisis)
        .values({
          comisionId: comisionId || null,
          totalRespuestasAlGenerar: totalRespuestasRegistradas,
          sintesis: sintesisData,
        });
    }

    return NextResponse.json({
      ok: true,
      totalComentariosAnalizados: comentariosValidos.length,
      totalRespuestasAlGenerar: totalRespuestasRegistradas,
      totalActual: totalRespuestasRegistradas,
      hayNuevasRespuestas: false,
      respuestasNuevasCount: 0,
      sintesis: sintesisData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error en sintesis-ia:", msg);
    return NextResponse.json({ error: "Error al generar la síntesis" }, { status: 500 });
  }
}
