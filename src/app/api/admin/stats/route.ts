import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, docentes, respuestas, respuestasDocentes } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";

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

    // 1. Respuestas generales
    const respuestasList = await db
      .select({
        id: respuestas.id,
        comisionId: respuestas.comisionId,
        comisionNombre: comisiones.nombre,
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
        createdAt: respuestas.createdAt,
      })
      .from(respuestas)
      .innerJoin(comisiones, eq(respuestas.comisionId, comisiones.id))
      .where(condition)
      .orderBy(desc(respuestas.createdAt));

    const total = respuestasList.length;

    let promediosGenerales = {
      ajustePrograma: 0,
      bibliografiaUtil: 0,
      coherenciaExamenes: 0,
      articulacionTeoriaPractica: 0,
    };

    let demografia = {
      recursantesCount: 0,
      recursantesPct: 0,
      conocimientosPreviosCount: 0,
      conocimientosPreviosPct: 0,
      practicoParcialesCount: 0,
      practicoParcialesPct: 0,
    };

    if (total > 0) {
      const sumaAjuste = respuestasList.reduce((acc, r) => acc + r.ajustePrograma, 0);
      const sumaBiblio = respuestasList.reduce((acc, r) => acc + r.bibliografiaUtil, 0);
      const sumaExamenes = respuestasList.reduce((acc, r) => acc + r.coherenciaExamenes, 0);

      // Calcular promedio de articulación desde respuestas_docentes (práctica)
      const articulacionQuery = db
        .select({
          promedio: sql<number | null>`round(avg(${respuestasDocentes.articulacionTeoriaPractica})::numeric, 2)::float`,
        })
        .from(respuestasDocentes)
        .innerJoin(respuestas, eq(respuestasDocentes.respuestaId, respuestas.id));

      const [articulacionRes] = await (comisionId
        ? articulacionQuery.where(eq(respuestas.comisionId, comisionId))
        : articulacionQuery);

      const promArticulacion = articulacionRes?.promedio ?? 0;

      promediosGenerales = {
        ajustePrograma: Number((sumaAjuste / total).toFixed(2)),
        bibliografiaUtil: Number((sumaBiblio / total).toFixed(2)),
        coherenciaExamenes: Number((sumaExamenes / total).toFixed(2)),
        articulacionTeoriaPractica: promArticulacion,
      };

      const recursantes = respuestasList.filter((r) => r.recursante).length;
      const conConocimientos = respuestasList.filter((r) => r.conocimientosPrevios).length;
      const practico = respuestasList.filter((r) => r.practicoParcialesPrevios).length;

      demografia = {
        recursantesCount: recursantes,
        recursantesPct: Number(((recursantes / total) * 100).toFixed(1)),
        conocimientosPreviosCount: conConocimientos,
        conocimientosPreviosPct: Number(((conConocimientos / total) * 100).toFixed(1)),
        practicoParcialesCount: practico,
        practicoParcialesPct: Number(((practico / total) * 100).toFixed(1)),
      };
    }

    // 2. Evaluaciones por docente
    const docentesQuery = db
      .select({
        docenteId: respuestasDocentes.docenteId,
        nombre: docentes.nombre,
        tipoDocente: respuestasDocentes.tipoDocente,
        totalEvaluaciones: sql<number>`count(${respuestasDocentes.id})::int`,
        promedioClaridad: sql<number>`round(avg(${respuestasDocentes.claridadPedagogica})::numeric, 2)::float`,
        promedioDisposicion: sql<number>`round(avg(${respuestasDocentes.disposicionConsultas})::numeric, 2)::float`,
        promedioPuntualidad: sql<number>`round(avg(${respuestasDocentes.puntualidadCumplimiento})::numeric, 2)::float`,
        promedioArticulacion: sql<number | null>`round(avg(${respuestasDocentes.articulacionTeoriaPractica})::numeric, 2)::float`,
      })
      .from(respuestasDocentes)
      .innerJoin(docentes, eq(respuestasDocentes.docenteId, docentes.id))
      .innerJoin(respuestas, eq(respuestasDocentes.respuestaId, respuestas.id));

    const evaluacionesPorDocente = await (comisionId
      ? docentesQuery.where(eq(respuestas.comisionId, comisionId))
      : docentesQuery
    )
      .groupBy(respuestasDocentes.docenteId, docentes.nombre, respuestasDocentes.tipoDocente)
      .orderBy(desc(sql`count(${respuestasDocentes.id})`));

    // 3. Comentarios cualitativos
    const comentarios = respuestasList
      .filter((r) => r.puntosPositivos || r.aspectosAMejorar || r.comentariosAdicionales)
      .map((r) => ({
        id: r.id,
        comisionNombre: r.comisionNombre,
        puntosPositivos: r.puntosPositivos,
        aspectosAMejorar: r.aspectosAMejorar,
        comentariosAdicionales: r.comentariosAdicionales,
        createdAt: r.createdAt,
      }));

    return NextResponse.json({
      total,
      promediosGenerales,
      demografia,
      evaluacionesPorDocente,
      comentarios,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al calcular estadísticas:", errorMessage);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
