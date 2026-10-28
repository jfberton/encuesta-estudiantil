import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, docentes, respuestas, respuestasDocentes } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const comisionIdParam = searchParams.get("comisionId");
    const comisionId = comisionIdParam ? parseInt(comisionIdParam, 10) : null;

    const condition = comisionId ? eq(respuestas.comisionId, comisionId) : undefined;

    const lista = await db
      .select({
        id: respuestas.id,
        fecha: respuestas.createdAt,
        comision: comisiones.nombre,
        recursante: respuestas.recursante,
        conocimientosPrevios: respuestas.conocimientosPrevios,
        practicoParcialesPrevios: respuestas.practicoParcialesPrevios,
        ajustePrograma: respuestas.ajustePrograma,
        bibliografiaUtil: respuestas.bibliografiaUtil,
        coherenciaExamenes: respuestas.coherenciaExamenes,
        articulacionTeoriaPractica: respuestas.articulacionTeoriaPractica,
        puntosPositivos: respuestas.puntosPositivos,
        aspectosAMejorar: respuestas.aspectosAMejorar,
        comentariosAdicionales: respuestas.comentariosAdicionales,
      })
      .from(respuestas)
      .innerJoin(comisiones, eq(respuestas.comisionId, comisiones.id))
      .where(condition)
      .orderBy(desc(respuestas.createdAt));

    // Obtener docentes evaluados para cada respuesta
    const docentesEvaluados = await db
      .select({
        respuestaId: respuestasDocentes.respuestaId,
        nombre: docentes.nombre,
        tipoDocente: respuestasDocentes.tipoDocente,
        claridad: respuestasDocentes.claridadPedagogica,
        disposicion: respuestasDocentes.disposicionConsultas,
        puntualidad: respuestasDocentes.puntualidadCumplimiento,
      })
      .from(respuestasDocentes)
      .innerJoin(docentes, eq(respuestasDocentes.docenteId, docentes.id));

    const docentesMap = new Map<number, string[]>();
    for (const d of docentesEvaluados) {
      const arr = docentesMap.get(d.respuestaId) || [];
      arr.push(
        `[${d.tipoDocente.toUpperCase()}] ${d.nombre} (Claridad:${d.claridad}, Disp:${d.disposicion}, Punt:${d.puntualidad})`
      );
      docentesMap.set(d.respuestaId, arr);
    }

    // Cabecera CSV
    const headers = [
      "ID",
      "Fecha",
      "Comisión",
      "Recursante",
      "Conocimientos Previos",
      "Practicó Parciales Previos",
      "Ajuste Programa (1-5)",
      "Bibliografía Útil (1-5)",
      "Coherencia Exámenes (1-5)",
      "Articulación Teoría-Práctica (1-5)",
      "Docentes Evaluados",
      "Puntos Positivos",
      "Aspectos a Mejorar",
      "Comentarios Adicionales",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = lista.map((r) => [
      r.id,
      r.fecha.toISOString(),
      escapeCsv(r.comision),
      r.recursante ? "Sí" : "No",
      r.conocimientosPrevios ? "Sí" : "No",
      r.practicoParcialesPrevios ? "Sí" : "No",
      r.ajustePrograma,
      r.bibliografiaUtil,
      r.coherenciaExamenes,
      r.articulacionTeoriaPractica,
      escapeCsv((docentesMap.get(r.id) || []).join(" | ")),
      escapeCsv(r.puntosPositivos || ""),
      escapeCsv(r.aspectosAMejorar || ""),
      escapeCsv(r.comentariosAdicionales || ""),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM para Excel
      headers.join(";") +
      "\n" +
      rows.map((row) => row.join(";")).join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="encuesta_catedra_${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al exportar CSV:", errorMessage);
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
