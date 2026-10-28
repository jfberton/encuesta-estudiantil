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
  claridadPedagogica: number;
  disposicionConsultas: number;
  puntualidadCumplimiento: number;
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

  // Estados del Formulario
  const [ajustePrograma, setAjustePrograma] = useState(3);
  const [bibliografiaUtil, setBibliografiaUtil] = useState(3);

  // Evaluaciones de Teoría (inician sin docente seleccionado para obligar la elección explícita)
  const [evaluacionesTeoria, setEvaluacionesTeoria] = useState<EvaluacionDocenteState[]>([
    {
      docenteId: 0,
      tipoDocente: "teoria",
      claridadPedagogica: 3,
      disposicionConsultas: 3,
      puntualidadCumplimiento: 3,
    },
  ]);

  // Evaluaciones de Práctica (inician sin docente seleccionado para obligar la elección explícita)
  const [evaluacionesPractica, setEvaluacionesPractica] = useState<EvaluacionDocenteState[]>([
    {
      docenteId: 0,
      tipoDocente: "practica",
      claridadPedagogica: 3,
      disposicionConsultas: 3,
      puntualidadCumplimiento: 3,
    },
  ]);

  const [articulacionTeoriaPractica, setArticulacionTeoriaPractica] = useState(3);
  const [coherenciaExamenes, setCoherenciaExamenes] = useState(3);
  const [practicoParcialesPrevios, setPracticoParcialesPrevios] = useState(false);
  const [recursante, setRecursante] = useState(false);
  const [conocimientosPrevios, setConocimientosPrevios] = useState(true);

  // Preguntas Abiertas
  const [puntosPositivos, setPuntosPositivos] = useState("");
  const [aspectosAMejorar, setAspectosAMejorar] = useState("");
  const [comentariosAdicionales, setComentariosAdicionales] = useState("");

  // Cargar si ya respondió
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setAjustePrograma(data.ajustePrograma ?? 3);
        setBibliografiaUtil(data.bibliografiaUtil ?? 3);
        if (data.evaluacionesTeoria) setEvaluacionesTeoria(data.evaluacionesTeoria);
        if (data.evaluacionesPractica) setEvaluacionesPractica(data.evaluacionesPractica);
        setArticulacionTeoriaPractica(data.articulacionTeoriaPractica ?? 3);
        setCoherenciaExamenes(data.coherenciaExamenes ?? 3);
        setPracticoParcialesPrevios(data.practicoParcialesPrevios ?? false);
        setRecursante(data.recursante ?? false);
        setConocimientosPrevios(data.conocimientosPrevios ?? true);
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
        claridadPedagogica: 3,
        disposicionConsultas: 3,
        puntualidadCumplimiento: 3,
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
    value: number
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
        claridadPedagogica: 3,
        disposicionConsultas: 3,
        puntualidadCumplimiento: 3,
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
    value: number
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

    // Validar selección explícita de docentes
    const sinDocenteTeoria = evaluacionesTeoria.some((e) => !e.docenteId || e.docenteId <= 0);
    const sinDocentePractica = evaluacionesPractica.some((e) => !e.docenteId || e.docenteId <= 0);

    if (sinDocenteTeoria || sinDocentePractica) {
      setErrorMessage(
        "Por favor, seleccioná a tu profesor en cada tarjeta de evaluación (Teoría y Práctico) antes de enviar el formulario."
      );
      window.scrollTo({ top: 350, behavior: "smooth" });
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
        articulacionTeoriaPractica,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-500" /> 100% Anónima
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

        <div className="bg-stone-50/80 rounded-2xl p-4 text-xs sm:text-sm text-stone-600 leading-relaxed border border-stone-200/60 font-normal">
          <strong>Introducción:</strong> Esta encuesta es 100% anónima. Su objetivo es
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

          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-800">
              Los contenidos dictados se ajustaron al programa de la materia.
            </label>
            <RatingBar
              value={ajustePrograma}
              onChange={setAjustePrograma}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              La bibliografía y el material de estudio estuvieron accesibles y fueron útiles para el aprendizaje.
            </label>
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
                className="bg-stone-50/60 rounded-2xl p-5 border border-stone-200/70 space-y-4"
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

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Claridad pedagógica:</strong> El docente explicó los temas de forma clara y accesible.
                  </label>
                  <RatingBar
                    value={ev.claridadPedagogica}
                    onChange={(val) => actualizarTeoria(idx, "claridadPedagogica", val)}
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Disposición a consultas:</strong> Mostró apertura para resolver dudas durante las clases o con posterioridad a ellas.
                  </label>
                  <RatingBar
                    value={ev.disposicionConsultas}
                    onChange={(val) => actualizarTeoria(idx, "disposicionConsultas", val)}
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Puntualidad y cumplimiento:</strong> Cumplió con los horarios y el cronograma pautado.
                  </label>
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
                className="bg-stone-50/60 rounded-2xl p-5 border border-stone-200/70 space-y-4"
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

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Claridad pedagógica:</strong> El docente explicó los temas de forma clara y accesible.
                  </label>
                  <RatingBar
                    value={ev.claridadPedagogica}
                    onChange={(val) =>
                      actualizarPractica(idx, "claridadPedagogica", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Disposición a consultas:</strong> Mostró apertura para resolver dudas durante las clases o con posterioridad a ellas.
                  </label>
                  <RatingBar
                    value={ev.disposicionConsultas}
                    onChange={(val) =>
                      actualizarPractica(idx, "disposicionConsultas", val)
                    }
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/50">
                  <label className="block text-xs font-normal text-stone-700">
                    <strong className="font-semibold text-stone-800">Puntualidad y cumplimiento:</strong> Cumplió con los horarios y el cronograma pautado.
                  </label>
                  <RatingBar
                    value={ev.puntualidadCumplimiento}
                    onChange={(val) =>
                      actualizarPractica(idx, "puntualidadCumplimiento", val)
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

          {/* ARTICULACIÓN TEORÍA-PRÁCTICA */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              <strong className="font-semibold text-stone-900">Articulación teoría-práctica:</strong> Las actividades prácticas y trabajos ayudaron a fijar los conceptos teóricos.
            </label>
            <RatingBar
              value={articulacionTeoriaPractica}
              onChange={setArticulacionTeoriaPractica}
              readOnly={isReadOnly}
            />
          </div>
        </section>

        {/* SECCIÓN 3: Evaluaciones y Perfil */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-6">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              3. Evaluaciones y Situación Académica
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Evaluaciones y Devoluciones
            </h2>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-800">
              Los exámenes/parciales guardaron coherencia con lo enseñado en clase. (Escala 1 al 5)
            </label>
            <RatingBar
              value={coherenciaExamenes}
              onChange={setCoherenciaExamenes}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              ¿Practicaste con ejemplos de parciales previos?
            </label>
            <SwitchButtons
              value={practicoParcialesPrevios}
              onChange={setPracticoParcialesPrevios}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              ¿Sos recursante de Matemática Financiera?
            </label>
            <SwitchButtons
              value={recursante}
              onChange={setRecursante}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              ¿Considerás que tenés los conocimientos previos necesarios para cursar la materia?
            </label>
            <SwitchButtons
              value={conocimientosPrevios}
              onChange={setConocimientosPrevios}
              readOnly={isReadOnly}
            />
          </div>
        </section>

        {/* SECCIÓN 4: Preguntas Abiertas */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-stone-200/70 space-y-5">
          <div className="border-b border-stone-100 pb-3.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
              4. Preguntas Abiertas (Cualitativas)
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
              Aportes y Sugerencias a la Cátedra
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-800">
              ¿Cuáles considerás que fueron los mayores puntos positivos de la cátedra este ciclo lectivo?
            </label>
            <textarea
              disabled={isReadOnly}
              rows={3}
              value={puntosPositivos}
              onChange={(e) => setPuntosPositivos(e.target.value)}
              placeholder="Escribí aquí los puntos destacados..."
              className="w-full rounded-2xl border border-stone-200 p-3.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white disabled:bg-stone-50 font-normal transition placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              ¿Qué aspectos específicos considerás que deberían revisarse o mejorarse para las próximas cohortes?
            </label>
            <textarea
              disabled={isReadOnly}
              rows={3}
              value={aspectosAMejorar}
              onChange={(e) => setAspectosAMejorar(e.target.value)}
              placeholder="Escribí aquí tus sugerencias de mejora..."
              className="w-full rounded-2xl border border-stone-200 p-3.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white disabled:bg-stone-50 font-normal transition placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-sm font-medium text-stone-800">
              Comentarios o sugerencias adicionales: <span className="text-xs font-normal text-stone-400">(Opcional)</span>
            </label>
            <textarea
              disabled={isReadOnly}
              rows={2}
              value={comentariosAdicionales}
              onChange={(e) => setComentariosAdicionales(e.target.value)}
              placeholder="Cualquier otro comentario que desees sumar..."
              className="w-full rounded-2xl border border-stone-200 p-3.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white disabled:bg-stone-50 font-normal transition placeholder:text-stone-400"
            />
          </div>
        </section>

        {/* Botón de Enviar (al final del formulario, sin flotar en pantalla) */}
        <div className="pt-4 pb-12">
          {isReadOnly ? (
            <div className="bg-[#18181B] text-white p-4 rounded-2xl shadow-xs flex items-center justify-center gap-2 font-medium text-sm">
              <Lock className="w-4 h-4 text-stone-400" /> Respuestas registradas - Modo revisión
            </div>
          ) : (
            <button
              type="submit"
              disabled={submitting || !comision.activa}
              className="w-full py-4 px-6 rounded-2xl bg-[#18181B] hover:bg-[#27272A] active:scale-[0.99] disabled:bg-stone-300 text-white font-medium text-sm sm:text-base border border-[#18181B] shadow-xs flex items-center justify-center gap-2.5 transition duration-150 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando respuestas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-stone-300" />
                  <span>Guardar y Enviar Encuesta</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
