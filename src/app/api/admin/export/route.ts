import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, docentes, respuestas, respuestasDocentes, sintesisAnalisis } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq, desc, isNull, sql } from "drizzle-orm";
import * as XLSX from "xlsx";

interface SintesisData {
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

    // 1. Obtener nombre de la comisión o ámbito
    let nombreAmbito = "Todas las comisiones (Consolidado Cátedra)";
    if (comisionId) {
      const [c] = await db
        .select({ nombre: comisiones.nombre, ciclo: comisiones.cicloLectivo })
        .from(comisiones)
        .where(eq(comisiones.id, comisionId))
        .limit(1);
      if (c) {
        nombreAmbito = `${c.nombre} (Ciclo ${c.ciclo})`;
      }
    }

    // 2. Obtener respuestas individuales
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

    const total = lista.length;

    // 3. Obtener evaluaciones docentes detalladas
    const docentesEvaluados = await db
      .select({
        respuestaId: respuestasDocentes.respuestaId,
        docenteId: respuestasDocentes.docenteId,
        nombre: docentes.nombre,
        tipoDocente: respuestasDocentes.tipoDocente,
        claridad: respuestasDocentes.claridadPedagogica,
        disposicion: respuestasDocentes.disposicionConsultas,
        puntualidad: respuestasDocentes.puntualidadCumplimiento,
        articulacion: respuestasDocentes.articulacionTeoriaPractica,
      })
      .from(respuestasDocentes)
      .innerJoin(docentes, eq(respuestasDocentes.docenteId, docentes.id));

    // Mapa de docentes por respuesta
    const docentesMap = new Map<number, string[]>();
    for (const d of docentesEvaluados) {
      const arr = docentesMap.get(d.respuestaId) || [];
      const articulacionText = d.articulacion ? `, Articulación: ${d.articulacion}/5` : "";
      arr.push(
        `[${d.tipoDocente.toUpperCase()}] ${d.nombre} (Claridad: ${d.claridad}/5, Disposición: ${d.disposicion}/5, Puntualidad: ${d.puntualidad}/5${articulacionText})`
      );
      docentesMap.set(d.respuestaId, arr);
    }

    // 4. Calcular métricas agregadas
    let promAjuste = 0;
    let promBiblio = 0;
    let promExamenes = 0;
    let promArticulacion = 0;

    let recursantesCount = 0;
    let recursantesPct = 0;
    let conConocimientosCount = 0;
    let conConocimientosPct = 0;
    let practicoCount = 0;
    let practicoPct = 0;

    if (total > 0) {
      const sumaAjuste = lista.reduce((acc, r) => acc + r.ajustePrograma, 0);
      const sumaBiblio = lista.reduce((acc, r) => acc + r.bibliografiaUtil, 0);
      const sumaExamenes = lista.reduce((acc, r) => acc + r.coherenciaExamenes, 0);

      // Calcular articulación promedio de práctica
      const articulacionQuery = db
        .select({
          promedio: sql<number | null>`round(avg(${respuestasDocentes.articulacionTeoriaPractica})::numeric, 2)::float`,
        })
        .from(respuestasDocentes)
        .innerJoin(respuestas, eq(respuestasDocentes.respuestaId, respuestas.id));

      const [articulacionRes] = await (comisionId
        ? articulacionQuery.where(eq(respuestas.comisionId, comisionId))
        : articulacionQuery);

      promAjuste = Number((sumaAjuste / total).toFixed(2));
      promBiblio = Number((sumaBiblio / total).toFixed(2));
      promExamenes = Number((sumaExamenes / total).toFixed(2));
      promArticulacion = articulacionRes?.promedio ?? 0;

      recursantesCount = lista.filter((r) => r.recursante).length;
      recursantesPct = Number(((recursantesCount / total) * 100).toFixed(1));

      conConocimientosCount = lista.filter((r) => r.conocimientosPrevios).length;
      conConocimientosPct = Number(((conConocimientosCount / total) * 100).toFixed(1));

      practicoCount = lista.filter((r) => r.practicoParcialesPrevios).length;
      practicoPct = Number(((practicoCount / total) * 100).toFixed(1));
    }

    // 5. Estadísticas de Docentes Agrupadas
    const docentesStatsQuery = db
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

    const evaluacionesDocentesStats = await (comisionId
      ? docentesStatsQuery.where(eq(respuestas.comisionId, comisionId))
      : docentesStatsQuery
    )
      .groupBy(respuestasDocentes.docenteId, docentes.nombre, respuestasDocentes.tipoDocente)
      .orderBy(desc(sql`count(${respuestasDocentes.id})`));

    // 6. Obtener síntesis cualitativa guardada con IA (si existe)
    const cacheCondition = comisionId
      ? eq(sintesisAnalisis.comisionId, comisionId)
      : isNull(sintesisAnalisis.comisionId);

    const [sintesisRow] = await db
      .select()
      .from(sintesisAnalisis)
      .where(cacheCondition)
      .limit(1);

    const sintesis = sintesisRow?.sintesis as SintesisData | undefined;

    // =========================================================================
    // CREACIÓN DEL LIBRO EXCEL (.XLSX)
    // =========================================================================
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------------------
    // HOJA 1: 📊 Dashboard y Métricas
    // -------------------------------------------------------------------------
    const dRows: (string | number | null | undefined)[][] = [
      ["UNIVERSIDAD NACIONAL DEL NORDESTE (UNNE) - FACULTAD DE CIENCIAS ECONÓMICAS"],
      ["CÁTEDRA: MATEMÁTICA FINANCIERA • INFORME EJECUTIVO DE ENCUESTAS ESTUDIANTILES"],
      [],
      ["Ámbito evaluado:", nombreAmbito],
      ["Fecha de emisión:", new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })],
      ["Total de estudiantes evaluadores:", total],
      [],
      ["1. EVALUACIÓN GENERAL DE LA CÁTEDRA (Escala 1 al 5)"],
      ["Criterio", "Promedio", "Escala Máxima"],
      ["Ajuste al Programa Oficial", promAjuste, "5.0"],
      ["Utilidad de la Bibliografía y Material de Estudio", promBiblio, "5.0"],
      ["Coherencia de los Exámenes con las Clases", promExamenes, "5.0"],
      ["Articulación entre Teoría y Práctica", promArticulacion, "5.0"],
      [],
      ["2. PERFIL ACADÉMICO DEL ESTUDIANTE"],
      ["Indicador", "Cantidad de Alumnos", "Porcentaje (%)"],
      ["¿Recursante de la materia?", recursantesCount, `${recursantesPct}%`],
      ["¿Contaba con conocimientos previos suficientes?", conConocimientosCount, `${conConocimientosPct}%`],
      ["¿Practicó con parciales de años anteriores?", practicoCount, `${practicoPct}%`],
      [],
      ["3. DESEMPEÑO DEL PLANTEL DOCENTE (Escala 1 al 5)"],
      [
        "Docente",
        "Rol / Tipo",
        "Evaluaciones",
        "Claridad Pedagógica",
        "Disposición Consultas",
        "Puntualidad y Cumplimiento",
        "Articulación T-P",
        "Promedio General",
      ],
    ];

    for (const d of evaluacionesDocentesStats) {
      const tieneArt = d.tipoDocente === "practica" && d.promedioArticulacion !== null;
      const cant = tieneArt ? 4 : 3;
      const suma = d.promedioClaridad + d.promedioDisposicion + d.promedioPuntualidad + (tieneArt ? Number(d.promedioArticulacion) : 0);
      const promGral = Number((suma / cant).toFixed(2));

      dRows.push([
        d.nombre,
        d.tipoDocente.toUpperCase(),
        d.totalEvaluaciones,
        d.promedioClaridad,
        d.promedioDisposicion,
        d.promedioPuntualidad,
        d.promedioArticulacion ?? "N/A",
        promGral,
      ]);
    }

    dRows.push([]);
    dRows.push(["4. SÍNTESIS CUALITATIVA ASISTIDA POR INTELIGENCIA ARTIFICIAL (GEMINI)"]);

    if (sintesis) {
      dRows.push(["Diagnóstico Pedagógico Ejecutivo:", sintesis.resumenEjecutivo]);
      dRows.push([]);
      dRows.push(["Aspectos Positivos Más Valorados"]);
      dRows.push(["Tema / Fortaleza", "% Menciones Est.", "Descripción", "Citas de Alumnos"]);
      for (const pos of sintesis.aspectosPositivos) {
        dRows.push([
          pos.tema,
          `${pos.porcentajeEstimado}%`,
          pos.descripcion,
          (pos.citas || []).map((c) => `"${c}"`).join(" | "),
        ]);
      }

      dRows.push([]);
      dRows.push(["Aspectos a Mejorar y Sugerencias de Acción"]);
      dRows.push(["Tema / Oportunidad de Mejora", "% Menciones Est.", "Descripción", "Sugerencia Pedagógica Concreta", "Citas de Alumnos"]);
      for (const mej of sintesis.aspectosAMejorar) {
        dRows.push([
          mej.tema,
          `${mej.porcentajeEstimado}%`,
          mej.descripcion,
          mej.sugerenciaAccion,
          (mej.citas || []).map((c) => `"${c}"`).join(" | "),
        ]);
      }

      if (sintesis.observacionesGenerales && sintesis.observacionesGenerales.length > 0) {
        dRows.push([]);
        dRows.push(["Otras Observaciones y Sugerencias"]);
        dRows.push(["Tema", "Detalle", "Cita"]);
        for (const obs of sintesis.observacionesGenerales) {
          dRows.push([obs.tema, obs.detalle, (obs.citas || []).join(" | ")]);
        }
      }
    } else {
      dRows.push(["(No se ha generado la síntesis con IA aún para esta selección en el panel docente)"]);
    }

    const wsDashboard = XLSX.utils.aoa_to_sheet(dRows);
    wsDashboard["!cols"] = [
      { wch: 38 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Métricas y Dashboard");

    // -------------------------------------------------------------------------
    // HOJA 2: 📋 Respuestas Detalladas
    // -------------------------------------------------------------------------
    const respuestasHeaders = [
      "ID",
      "Fecha y Hora",
      "Comisión",
      "¿Recursante?",
      "¿Conocimientos Previos?",
      "¿Practicó Parciales Previos?",
      "Ajuste Programa (1-5)",
      "Bibliografía Útil (1-5)",
      "Coherencia Exámenes (1-5)",
      "Articulación Teoría-Práctica (1-5)",
      "Evaluaciones de Docentes",
      "Puntos Positivos (Texto Libre)",
      "Aspectos a Mejorar (Texto Libre)",
      "Comentarios Adicionales (Texto Libre)",
    ];

    const respuestasRows = lista.map((r) => [
      r.id,
      r.fecha.toLocaleString("es-AR"),
      r.comision,
      r.recursante ? "Sí" : "No",
      r.conocimientosPrevios ? "Sí" : "No",
      r.practicoParcialesPrevios ? "Sí" : "No",
      r.ajustePrograma,
      r.bibliografiaUtil,
      r.coherenciaExamenes,
      r.articulacionTeoriaPractica ?? "N/A",
      (docentesMap.get(r.id) || []).join(" // "),
      r.puntosPositivos || "",
      r.aspectosAMejorar || "",
      r.comentariosAdicionales || "",
    ]);

    const wsRespuestas = XLSX.utils.aoa_to_sheet([respuestasHeaders, ...respuestasRows]);
    wsRespuestas["!cols"] = [
      { wch: 8 },  // ID
      { wch: 18 }, // Fecha
      { wch: 26 }, // Comision
      { wch: 14 }, // Recursante
      { wch: 22 }, // Conocimientos
      { wch: 24 }, // Practicó parciales
      { wch: 20 }, // Ajuste
      { wch: 20 }, // Biblio
      { wch: 22 }, // Examenes
      { wch: 24 }, // Articulación
      { wch: 50 }, // Docentes
      { wch: 45 }, // Positivos
      { wch: 45 }, // Mejoras
      { wch: 45 }, // Comentarios
    ];
    XLSX.utils.book_append_sheet(wb, wsRespuestas, "Respuestas Detalladas");

    // Generar archivo binario XLSX
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const safeSlug = nombreAmbito
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30);

    return new NextResponse(wbout, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Informe_Catedra_${safeSlug}_${Date.now()}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al exportar Excel XLSX:", errorMessage);
    return NextResponse.json({ error: "Error al exportar informe Excel" }, { status: 500 });
  }
}
