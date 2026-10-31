import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, respuestas, respuestasDocentes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // 2. Validar que este dispositivo no haya enviado previamente
    const [existente] = await db
      .select({ id: respuestas.id })
      .from(respuestas)
      .where(
        and(
          eq(respuestas.comisionId, comision.id),
          eq(respuestas.deviceFingerprint, deviceFingerprint)
        )
      )
      .limit(1);

    if (existente) {
      return NextResponse.json(
        { error: "Este dispositivo ya registró una respuesta para esta comisión." },
        { status: 409 }
      );
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
