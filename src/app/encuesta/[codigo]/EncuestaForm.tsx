"use client";

import React, { useState, useEffect } from "react";
import { RatingBar } from "@/components/RatingBar";
import { SwitchButtons } from "@/components/SwitchButtons";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { UnneLogo } from "@/components/UnneLogo";
import { CheckCircle2, Lock, Plus, Trash2, Send, AlertTriangle, ShieldCheck } from "lucide-react";

interface DocenteItem {
  id: number;
  nombre: string;
  rol: string;
}

interface EvaluacionDocenteState {
  docenteId: number;
  tipoDocente: "teoria" | "practica";
  claridadPedagogica: number | null;
  disposicionConsultas: number | null;
  puntualidadCumplimiento: number | null;
  articulacionTeoriaPractica?: number | null;
}

interface EncuestaFormProps {
  comision: {
    id: number;
    nombre: string;
    materia: string;
    cicloLectivo: string;
    codigoAcceso: string;
    activa: boolean;
  };
  docentesTeoria: DocenteItem[];
  docentesPractica: DocenteItem[];
}

export function EncuestaForm({
  comision,
  docentesTeoria,
  docentesPractica,
}: EncuestaFormProps) {
  const storageKey = `encuesta_completada_${comision.codigoAcceso}`;

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados del Formulario (inician sin nada preseleccionado: null)
  const [ajustePrograma, setAjustePrograma] = useState<number | null>(null);
  const [bibliografiaUtil, setBibliografiaUtil] = useState<number | null>(null);

  // Evaluaciones de Teoría
  const [evaluacionesTeoria, setEvaluacionesTeoria] = useState<EvaluacionDocenteState[]>([
    {
      docenteId: 0,
      tipoDocente: "teoria",
      claridadPedagogica: null,
      disposicionConsultas: null,
      puntualidadCumplimiento: null,
    },
  ]);

  // Evaluaciones de Práctica (incluye articulación teoría-práctica)
  const [evaluacionesPractica, setEvaluacionesPractica] = useState<EvaluacionDocenteState[]>([
    {
      docenteId: 0,
      tipoDocente: "practica",
      claridadPedagogica: null,
      disposicionConsultas: null,
      puntualidadCumplimiento: null,
      articulacionTeoriaPractica: null,
    },
  ]);

  const [coherenciaExamenes, setCoherenciaExamenes] = useState<number | null>(null);
  const [practicoParcialesPrevios, setPracticoParcialesPrevios] = useState<boolean | null>(null);
  const [recursante, setRecursante] = useState<boolean | null>(null);
  const [conocimientosPrevios, setConocimientosPrevios] = useState<boolean | null>(null);

  // Preguntas Abiertas
  const [puntosPositivos, setPuntosPositivos] = useState("");
  const [aspectosAMejorar, setAspectosAMejorar] = useState("");
  const [comentariosAdicionales, setComentariosAdicionales] = useState("");

  // Cargar si ya respondió previamente desde este dispositivo
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setAjustePrograma(data.ajustePrograma ?? null);
        setBibliografiaUtil(data.bibliografiaUtil ?? null);
        if (data.evaluacionesTeoria) setEvaluacionesTeoria(data.evaluacionesTeoria);
        if (data.evaluacionesPractica) setEvaluacionesPractica(data.evaluacionesPractica);
        setCoherenciaExamenes(data.coherenciaExamenes ?? null);
        setPracticoParcialesPrevios(data.practicoParcialesPrevios ?? null);
        setRecursante(data.recursante ?? null);
        setConocimientosPrevios(data.conocimientosPrevios ?? null);
        setPuntosPositivos(data.puntosPositivos ?? "");
        setAspectosAMejorar(data.aspectosAMejorar ?? "");
        setComentariosAdicionales(data.comentariosAdicionales ?? "");
        setIsReadOnly(true);
      }
    } catch (e) {
      console.error("Error al leer localStorage:", e);
    }
  }, [storageKey]);

  // Docentes teoría
  const agregarDocenteTeoria = () => {
    if (evaluacionesTeoria.length >= docentesTeoria.length) return;
    setEvaluacionesTeoria([
      ...evaluacionesTeoria,
      {
        docenteId: 0,
        tipoDocente: "teoria",
        claridadPedagogica: null,
        disposicionConsultas: null,
        puntualidadCumplimiento: null,
      },
    ]);
  };

  const quitarDocenteTeoria = (index: number) => {
    if (evaluacionesTeoria.length <= 1) return;
    setEvaluacionesTeoria(evaluacionesTeoria.filter((_, i) => i !== index));
  };

  const actualizarTeoria = (
    index: number,
    field: keyof EvaluacionDocenteState,
    value: number | null
  ) => {
    const copy = [...evaluacionesTeoria];
    copy[index] = { ...copy[index], [field]: value };
    setEvaluacionesTeoria(copy);
  };

  // Docentes práctica
  const agregarDocentePractica = () => {
    if (evaluacionesPractica.length >= docentesPractica.length) return;
    setEvaluacionesPractica([
      ...evaluacionesPractica,
      {
        docenteId: 0,
        tipoDocente: "practica",
        claridadPedagogica: null,
        disposicionConsultas: null,
        puntualidadCumplimiento: null,
        articulacionTeoriaPractica: null,
      },
    ]);
  };

  const quitarDocentePractica = (index: number) => {
    if (evaluacionesPractica.length <= 1) return;
    setEvaluacionesPractica(evaluacionesPractica.filter((_, i) => i !== index));
  };

  const actualizarPractica = (
    index: number,
    field: keyof EvaluacionDocenteState,
    value: number | null
  ) => {
    const copy = [...evaluacionesPractica];
    copy[index] = { ...copy[index], [field]: value };
    setEvaluacionesPractica(copy);
  };

  // Enviar encuesta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!comision.activa) {
      setErrorMessage("La encuesta se encuentra cerrada para esta comisión.");
      return;
    }

    // 1. Validar selección de docentes
    const sinDocenteTeoria = evaluacionesTeoria.some((ev) => !ev.docenteId || ev.docenteId <= 0);
    const sinDocentePractica = evaluacionesPractica.some((ev) => !ev.docenteId || ev.docenteId <= 0);

    if (sinDocenteTeoria || sinDocentePractica) {
      setErrorMessage(
        "Por favor, seleccioná a tu profesor en cada tarjeta de evaluación (Teoría y Práctico) antes de enviar el formulario."
      );
      window.scrollTo({ top: 350, behavior: "smooth" });
      return;
    }

    // 2. Validar que no haya preguntas obligatorias sin responder
    if (ajustePrograma === null || bibliografiaUtil === null) {
      setErrorMessage("Por favor, calificá los contenidos y la bibliografía en la Sección 1.");
      window.scrollTo({ top: 250, behavior: "smooth" });
      return;
    }

    const faltaTeoria = evaluacionesTeoria.some(
      (ev) =>
        ev.claridadPedagogica === null ||
        ev.disposicionConsultas === null ||
        ev.puntualidadCumplimiento === null
    );
    if (faltaTeoria) {
      setErrorMessage("Por favor, calificá todos los aspectos del profesor de Teoría.");
      window.scrollTo({ top: 400, behavior: "smooth" });
      return;
    }

    const faltaPractica = evaluacionesPractica.some(
      (ev) =>
        ev.claridadPedagogica === null ||
        ev.disposicionConsultas === null ||
        ev.puntualidadCumplimiento === null ||
        ev.articulacionTeoriaPractica === null
    );
    if (faltaPractica) {
      setErrorMessage(
        "Por favor, calificá todos los aspectos del profesor de Práctica (incluyendo la Articulación Teoría-Práctica)."
      );
      window.scrollTo({ top: 550, behavior: "smooth" });
      return;
    }

    if (coherenciaExamenes === null) {
      setErrorMessage("Por favor, calificá la coherencia de las evaluaciones en la Sección 3.");
      return;
    }

    if (
      practicoParcialesPrevios === null ||
      recursante === null ||
      conocimientosPrevios === null
    ) {
      setErrorMessage("Por favor, respondé todas las preguntas de Sí/No en la Sección 3.");
      return;
    }

    setSubmitting(true);

    try {
      const fingerprint = await getDeviceFingerprint();

      const payload = {
        deviceFingerprint: fingerprint,
        recursante,
        conocimientosPrevios,
        practicoParcialesPrevios,
        ajustePrograma,
        bibliografiaUtil,
        coherenciaExamenes,
        puntosPositivos,
        aspectosAMejorar,
        comentariosAdicionales,
        evaluacionesDocentes: [...evaluacionesTeoria, ...evaluacionesPractica],
      };

      const res = await fetch(`/api/encuesta/${comision.codigoAcceso}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Ocurrió un error al enviar la encuesta.");
        setSubmitting(false);
        return;
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...payload,
          evaluacionesTeoria,
          evaluacionesPractica,
          submittedAt: new Date().toISOString(),
        })
      );

      setIsReadOnly(true);
      setSuccessMessage("¡Tus respuestas fueron enviadas con éxito a la Cátedra! Muchas gracias por participar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Cabecera UNNE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <UnneLogo className="h-10 sm:h-11 w-auto" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Anónima
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Encuesta de Opinión Estudiantil
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal">
            {comision.nombre} • Ciclo Lectivo {comision.cicloLectivo}
          </p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 border border-emerald-200/60 leading-relaxed font-normal">
          <strong className="font-semibold text-emerald-900">Introducción:</strong> Esta encuesta es 100% anónima. Su objetivo es
          conocer tu experiencia durante la cursada para identificar fortalezas y aspectos a
          mejorar en el dictado de la materia.
        </div>
      </div>

      {/* Cartel de Alerta si ya fue enviada */}
      {isReadOnly && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-stone-800 shadow-xs flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm sm:text-base">
              Encuesta finalizada (Modo sólo lectura)
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
              Esta encuesta ya fue enviada desde este dispositivo. A continuación podés revisar
              las respuestas que emitiste, pero no es posible modificar ni volver a enviar el
              formulario.
            </p>
          </div>
        </div>
      )}

      {/* Cartel de Éxito */}
      {successMessage && (
        <div className="bg-stone-50 border border-stone-300 rounded-2xl p-5 text-stone-900 shadow-xs flex items-start gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-stone-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{successMessage}</h3>
            <p className="text-xs text-stone-500 mt-0.5 font-normal">
              Tus respuestas ya quedaron registradas en la base de datos de la cátedra.
            </p>
          </div>
        </div>
      )}

      {/* Cartel de Error */}
      {errorMessage && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 text-rose-800 shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: Planificación y Contenidos */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-6">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              1. Planificación y Contenidos
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Planificación y Contenidos de la Materia
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-normal">
              Escala del 1 al 5: 1 = Muy en desacuerdo / Deficiente, 5 = Muy de acuerdo / Excelente
            </p>
          </div>

          {/* Pregunta 1: Ajuste al programa */}
          <div className="space-y-3">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              Los contenidos dictados se ajustaron al programa oficial de la cátedra.
            </p>
            <RatingBar
              value={ajustePrograma}
              onChange={setAjustePrograma}
              readOnly={isReadOnly}
            />
          </div>

          {/* Pregunta 2: Bibliografía */}
          <div className="space-y-3 pt-5 border-t border-stone-100">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              La bibliografía y el material de estudio estuvieron accesibles y fueron útiles para el aprendizaje.
            </p>
            <RatingBar
              value={bibliografiaUtil}
              onChange={setBibliografiaUtil}
              readOnly={isReadOnly}
            />
          </div>
        </section>

        {/* SECCIÓN 2: Desempeño Docente */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-6">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              2. Desempeño Docente
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Evaluación del Cuerpo Docente
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-normal">
              Evaluá a los docentes de Teoría y Práctica a cuyas clases asististe.
            </p>
          </div>

          {/* DOCENTES DE TEORÍA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Profesor(es) de Teoría
              </h3>
            </div>

            {evaluacionesTeoria.map((ev, idx) => (
              <div
                key={idx}
                className="bg-stone-50/60 rounded-2xl p-5 border border-stone-200/70 space-y-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200/70 shadow-2xs">
                    Profesor de Teoría #{idx + 1}
                  </span>
                  {!isReadOnly && evaluacionesTeoria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarDocenteTeoria(idx)}
                      className="text-stone-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Profesor de Teoría al que asististe:
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={ev.docenteId || ""}
                    onChange={(e) =>
                      actualizarTeoria(idx, "docenteId", Number(e.target.value))
                    }
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm font-normal focus:border-stone-500 focus:outline-none transition ${
                      ev.docenteId === 0
                        ? "border-amber-300 bg-amber-50/20 text-stone-500"
                        : "border-stone-200 text-stone-800"
                    }`}
                  >
                    <option value="" disabled>
                      -- Seleccioná un profesor de Teoría --
                    </option>
                    {docentesTeoria
                      .filter(
                        (d) =>
                          d.id === ev.docenteId ||
                          !evaluacionesTeoria.some(
                            (other, oIdx) =>
                              oIdx !== idx && other.docenteId === d.id && other.docenteId > 0
                          )
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Pregunta 1: Claridad pedagógica */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    El docente explicó los temas de forma clara y comprensible.
                  </p>
                  <RatingBar
                    value={ev.claridadPedagogica}
                    onChange={(val) => actualizarTeoria(idx, "claridadPedagogica", val)}
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Pregunta 2: Disposición a consultas */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    Mostró apertura y buena disposición para resolver dudas durante o después de clase.
                  </p>
                  <RatingBar
                    value={ev.disposicionConsultas}
                    onChange={(val) => actualizarTeoria(idx, "disposicionConsultas", val)}
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Pregunta 3: Puntualidad y cumplimiento */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    Cumplió con los horarios pautados y el cronograma de clases.
                  </p>
                  <RatingBar
                    value={ev.puntualidadCumplimiento}
                    onChange={(val) =>
                      actualizarTeoria(idx, "puntualidadCumplimiento", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            ))}

            {!isReadOnly && docentesTeoria.length > evaluacionesTeoria.length && (
              <button
                type="button"
                onClick={agregarDocenteTeoria}
                disabled={evaluacionesTeoria.some((e) => !e.docenteId || e.docenteId <= 0)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 text-stone-600 font-medium text-xs sm:text-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-400 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Agregar otro profesor de Teoría
              </button>
            )}
          </div>

          {/* DOCENTES DE PRÁCTICA */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Profesor(es) de Práctico
              </h3>
            </div>

            {evaluacionesPractica.map((ev, idx) => (
              <div
                key={idx}
                className="bg-stone-50/60 rounded-2xl p-5 border border-stone-200/70 space-y-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200/70 shadow-2xs">
                    Profesor de Práctico #{idx + 1}
                  </span>
                  {!isReadOnly && evaluacionesPractica.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarDocentePractica(idx)}
                      className="text-stone-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Profesor de Práctico al que asististe:
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={ev.docenteId || ""}
                    onChange={(e) =>
                      actualizarPractica(idx, "docenteId", Number(e.target.value))
                    }
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm font-normal focus:border-stone-500 focus:outline-none transition ${
                      ev.docenteId === 0
                        ? "border-amber-300 bg-amber-50/20 text-stone-500"
                        : "border-stone-200 text-stone-800"
                    }`}
                  >
                    <option value="" disabled>
                      -- Seleccioná un profesor de Práctico --
                    </option>
                    {docentesPractica
                      .filter(
                        (d) =>
                          d.id === ev.docenteId ||
                          !evaluacionesPractica.some(
                            (other, oIdx) =>
                              oIdx !== idx && other.docenteId === d.id && other.docenteId > 0
                          )
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Pregunta 1: Claridad pedagógica */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    El docente explicó los temas prácticos de forma clara y comprensible.
                  </p>
                  <RatingBar
                    value={ev.claridadPedagogica}
                    onChange={(val) =>
                      actualizarPractica(idx, "claridadPedagogica", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Pregunta 2: Disposición a consultas */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    Mostró apertura y buena disposición para resolver dudas durante o después de clase.
                  </p>
                  <RatingBar
                    value={ev.disposicionConsultas}
                    onChange={(val) =>
                      actualizarPractica(idx, "disposicionConsultas", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Pregunta 3: Puntualidad y cumplimiento */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    Cumplió con los horarios pautados y el cronograma de clases.
                  </p>
                  <RatingBar
                    value={ev.puntualidadCumplimiento}
                    onChange={(val) =>
                      actualizarPractica(idx, "puntualidadCumplimiento", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Pregunta 4: Articulación teoría-práctica (específico de profesores de práctica) */}
                <div className="space-y-3 pt-3 border-t border-stone-200/60">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    Las actividades prácticas y trabajos ayudaron a fijar y articular los conceptos teóricos.
                  </p>
                  <RatingBar
                    value={ev.articulacionTeoriaPractica ?? null}
                    onChange={(val) =>
                      actualizarPractica(idx, "articulacionTeoriaPractica", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            ))}

            {!isReadOnly && docentesPractica.length > evaluacionesPractica.length && (
              <button
                type="button"
                onClick={agregarDocentePractica}
                disabled={evaluacionesPractica.some((e) => !e.docenteId || e.docenteId <= 0)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 text-stone-600 font-medium text-xs sm:text-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-400 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Agregar otro profesor de Práctica
              </button>
            )}
          </div>
        </section>

        {/* SECCIÓN 3: Evaluaciones y Perfil */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-6">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              3. Evaluaciones y Situación Académica
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Evaluaciones y Situación Académica
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              Los exámenes parciales guardaron coherencia con lo enseñado en clase y en las guías de trabajos prácticos.
            </p>
            <RatingBar
              value={coherenciaExamenes}
              onChange={setCoherenciaExamenes}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-5 border-t border-stone-100">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              ¿Practicaste con ejemplos de exámenes parciales de años anteriores?
            </p>
            <SwitchButtons
              value={practicoParcialesPrevios}
              onChange={setPracticoParcialesPrevios}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-5 border-t border-stone-100">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              ¿Sos recursante de Matemática Financiera?
            </p>
            <SwitchButtons
              value={recursante}
              onChange={setRecursante}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-5 border-t border-stone-100">
            <p className="text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              ¿Considerás que tenés los conocimientos previos necesarios para cursar la materia?
            </p>
            <SwitchButtons
              value={conocimientosPrevios}
              onChange={setConocimientosPrevios}
              readOnly={isReadOnly}
            />
          </div>
        </section>

        {/* SECCIÓN 4: Preguntas Abiertas */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-6">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              4. Preguntas Abiertas (Cualitativas)
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Aportes y Sugerencias a la Cátedra
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              Puntos positivos o fortalezas que destacarías de la cátedra:
            </label>
            <textarea
              disabled={isReadOnly}
              rows={3}
              value={puntosPositivos}
              onChange={(e) => setPuntosPositivos(e.target.value)}
              placeholder="Escribí aquí lo que consideres más valioso..."
              className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl p-3.5 text-sm font-normal text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-500 focus:outline-none transition resize-none disabled:bg-stone-50 disabled:text-stone-600"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <label className="block text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              Aspectos que considerás que se deberían mejorar o ajustar:
            </label>
            <textarea
              disabled={isReadOnly}
              rows={3}
              value={aspectosAMejorar}
              onChange={(e) => setAspectosAMejorar(e.target.value)}
              placeholder="Sugerencias constructivas para futuras cursadas..."
              className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl p-3.5 text-sm font-normal text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-500 focus:outline-none transition resize-none disabled:bg-stone-50 disabled:text-stone-600"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <label className="block text-sm sm:text-base font-semibold text-stone-800 leading-snug">
              Comentarios u observaciones adicionales que desees transmitir:
            </label>
            <textarea
              disabled={isReadOnly}
              rows={2}
              value={comentariosAdicionales}
              onChange={(e) => setComentariosAdicionales(e.target.value)}
              placeholder="Cualquier otro comentario relevante..."
              className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl p-3.5 text-sm font-normal text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-500 focus:outline-none transition resize-none disabled:bg-stone-50 disabled:text-stone-600"
            />
          </div>
        </section>

        {/* Botón de Envío */}
        {!isReadOnly && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando respuestas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Enviar Encuesta Anónima</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400 mt-2.5 font-normal">
              Al enviar confirmás que tus respuestas son definitivas y anónimas.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
