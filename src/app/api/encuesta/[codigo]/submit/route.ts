import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, respuestas, respuestasDocentes } from "@/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";

interface EvaluacionDocenteInput {
  docenteId: number;
  tipoDocente: "teoria" | "practica";
  claridadPedagogica: number;
  disposicionConsultas: number;
  puntualidadCumplimiento: number;
  articulacionTeoriaPractica?: number | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const body = await req.json();

    const {
      deviceFingerprint,
      recursante,
      conocimientosPrevios,
      practicoParcialesPrevios,
      ajustePrograma,
      bibliografiaUtil,
      coherenciaExamenes,
      puntosPositivos,
      aspectosAMejorar,
      comentariosAdicionales,
      evaluacionesDocentes,
    } = body;

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: "Identificador de dispositivo no provisto" },
        { status: 400 }
      );
    }

    if (
      Array.isArray(evaluacionesDocentes) &&
      evaluacionesDocentes.some((ev: EvaluacionDocenteInput) => !ev.docenteId || ev.docenteId <= 0)
    ) {
      return NextResponse.json(
        { error: "Debe seleccionar un profesor en cada bloque de evaluación docente." },
        { status: 400 }
      );
    }

    // 1. Validar que la comisión exista y esté activa
    const [comision] = await db
      .select()
      .from(comisiones)
      .where(eq(comisiones.codigoAcceso, codigo))
      .limit(1);

    if (!comision) {
      return NextResponse.json({ error: "Comisión inexistente" }, { status: 404 });
    }

    if (!comision.activa) {
      return NextResponse.json(
        { error: "La encuesta se encuentra cerrada para esta comisión." },
        { status: 403 }
      );
    }

    // 2. Validación Híbrida Antifraude:
    // Desglosar identificación: UUID de navegador + Hash de modelo de hardware
    let clientUuid = deviceFingerprint;
    let hardwareHash = "";

    if (deviceFingerprint.includes(":::")) {
      const parts = deviceFingerprint.split(":::");
      clientUuid = parts[0];
      hardwareHash = parts[1] || "";
    }

    // Regla A (Mismo navegador): Bloquear si este navegador específico ya votó en esta comisión
    const [existentePorUuid] = await db
      .select({ id: respuestas.id })
      .from(respuestas)
      .where(
        and(
          eq(respuestas.comisionId, comision.id),
          or(
            eq(respuestas.deviceFingerprint, clientUuid),
            like(respuestas.deviceFingerprint, `${clientUuid}:::%`)
          )
        )
      )
      .limit(1);

    if (existentePorUuid) {
      return NextResponse.json(
        { error: "Este dispositivo ya registró una respuesta para esta comisión." },
        { status: 409 }
      );
    }

    // Regla B (Control de abuso en Incógnito por modelo de teléfono):
    // Si alguien abre pestañas de incógnito repetidas en el mismo aparato:
    if (hardwareHash) {
      const respuestasMismoHardware = await db
        .select({ id: respuestas.id, createdAt: respuestas.createdAt })
        .from(respuestas)
        .where(
          and(
            eq(respuestas.comisionId, comision.id),
            or(
              eq(respuestas.deviceFingerprint, hardwareHash),
              like(respuestas.deviceFingerprint, `%:::${hardwareHash}`)
            )
          )
        )
        .orderBy(desc(respuestas.createdAt));

      // B.1 Cooldown de 60 segundos: no se permiten dos envíos del mismo hardware casi simultáneos
      if (respuestasMismoHardware.length > 0) {
        const ultimoVoto = respuestasMismoHardware[0];
        const segundosDesdeUltimo = (Date.now() - new Date(ultimoVoto.createdAt).getTime()) / 1000;
        if (segundosDesdeUltimo < 60) {
          return NextResponse.json(
            {
              error: "Se detectó un envío reciente desde este modelo de teléfono. Por favor, aguardá un minuto para enviar.",
            },
            { status: 429 }
          );
        }
      }

      // B.2 Tolerancia de modelos idénticos por comisión:
      // Permite hasta 4 alumnos en la misma aula con el mismo modelo exacto de teléfono
      if (respuestasMismoHardware.length >= 4) {
        return NextResponse.json(
          {
            error: "Se ha alcanzado el límite de respuestas permitidas para este modelo de teléfono en esta comisión.",
          },
          { status: 409 }
        );
      }
    }

    // 3. Insertar respuesta principal
    const [nuevaRespuesta] = await db
      .insert(respuestas)
      .values({
        comisionId: comision.id,
        deviceFingerprint,
        recursante: Boolean(recursante),
        conocimientosPrevios: Boolean(conocimientosPrevios),
        practicoParcialesPrevios: Boolean(practicoParcialesPrevios),
        ajustePrograma: Number(ajustePrograma) || 3,
        bibliografiaUtil: Number(bibliografiaUtil) || 3,
        coherenciaExamenes: Number(coherenciaExamenes) || 3,
        articulacionTeoriaPractica: null, // Ahora se almacena específicamente por docente de práctica
        puntosPositivos: puntosPositivos?.trim() || null,
        aspectosAMejorar: aspectosAMejorar?.trim() || null,
        comentariosAdicionales: comentariosAdicionales?.trim() || null,
      })
      .returning();

    // 4. Insertar evaluaciones de docentes
    if (Array.isArray(evaluacionesDocentes) && evaluacionesDocentes.length > 0) {
      const records = evaluacionesDocentes
        .filter((ev: EvaluacionDocenteInput) => ev.docenteId && ev.docenteId > 0)
        .map((ev: EvaluacionDocenteInput) => ({
          respuestaId: nuevaRespuesta.id,
          docenteId: ev.docenteId,
          tipoDocente: ev.tipoDocente,
          claridadPedagogica: Math.min(5, Math.max(1, Number(ev.claridadPedagogica) || 3)),
          disposicionConsultas: Math.min(5, Math.max(1, Number(ev.disposicionConsultas) || 3)),
          puntualidadCumplimiento: Math.min(5, Math.max(1, Number(ev.puntualidadCumplimiento) || 3)),
          articulacionTeoriaPractica:
            ev.tipoDocente === "practica" && ev.articulacionTeoriaPractica
              ? Math.min(5, Math.max(1, Number(ev.articulacionTeoriaPractica)))
              : null,
        }));

      if (records.length > 0) {
        await db.insert(respuestasDocentes).values(records);
      }
    }

    return NextResponse.json({ ok: true, id: nuevaRespuesta.id });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al guardar respuesta:", errorMessage);
    return NextResponse.json({ error: "Error al procesar el envío" }, { status: 500 });
  }
}
