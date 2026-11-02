"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  BarChart3,
  QrCode,
  LogOut,
  Plus,
  Check,
  X,
  ExternalLink,
  Download,
  Trash2,
  Lock,
  Play,
  TrendingUp,
  MessageSquare,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  Radio,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ThumbsUp,
} from "lucide-react";
import QRCode from "qrcode";
import { UnneLogo } from "@/components/UnneLogo";

interface Comision {
  id: number;
  nombre: string;
  materia: string;
  cicloLectivo: string;
  codigoAcceso: string;
  activa: boolean;
  totalRespuestas: number;
}

interface Docente {
  id: number;
  nombre: string;
  rol: "teoria" | "practica" | "ambos";
  activo: boolean;
}

interface StatsData {
  total: number;
  promediosGenerales: {
    ajustePrograma: number;
    bibliografiaUtil: number;
    coherenciaExamenes: number;
    articulacionTeoriaPractica: number;
  };
  demografia: {
    recursantesCount: number;
    recursantesPct: number;
    conocimientosPreviosCount: number;
    conocimientosPreviosPct: number;
    practicoParcialesCount: number;
    practicoParcialesPct: number;
  };
  evaluacionesPorDocente: Array<{
    docenteId: number;
    nombre: string;
    tipoDocente: string;
    totalEvaluaciones: number;
    promedioClaridad: number;
    promedioDisposicion: number;
    promedioPuntualidad: number;
    promedioArticulacion?: number | null;
  }>;
  comentarios: Array<{
    id: number;
    comisionNombre: string;
    puntosPositivos: string | null;
    aspectosAMejorar: string | null;
    comentariosAdicionales: string | null;
    createdAt: string;
  }>;
}

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

export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"comisiones" | "docentes" | "stats">("comisiones");

  // Estado Comisiones
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loadingComisiones, setLoadingComisiones] = useState(true);
  const [showNuevaModal, setShowNuevaModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaActiva, setNuevaActiva] = useState(true);
  const [guardandoComision, setGuardandoComision] = useState(false);
  const [comisionAEliminar, setComisionAEliminar] = useState<Comision | null>(null);
  const [eliminandoComision, setEliminandoComision] = useState(false);

  // Estado Docentes
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(true);
  const [nuevoDocenteNombre, setNuevoDocenteNombre] = useState("");
  const [nuevoDocenteRol, setNuevoDocenteRol] = useState<"teoria" | "practica" | "ambos">("ambos");

  // Estado Estadísticas
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedComisionId, setSelectedComisionId] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Copiado feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Estado Síntesis IA y Persistencia en BD
  const [sintesis, setSintesis] = useState<SintesisData | null>(null);
  const [sintesisGuardada, setSintesisGuardada] = useState<{
    totalRespuestasAlGenerar: number;
    updatedAt: string;
  } | null>(null);
  const [hayNuevasRespuestas, setHayNuevasRespuestas] = useState(false);
  const [respuestasNuevasCount, setRespuestasNuevasCount] = useState(0);
  const [cargandoSintesis, setCargandoSintesis] = useState(false);
  const [errorSintesis, setErrorSintesis] = useState<string | null>(null);
  const [vistaComentarios, setVistaComentarios] = useState<"sintesis" | "individuales">("individuales");
  const [expandedTemas, setExpandedTemas] = useState<Record<string, boolean>>({});

  const toggleExpandTema = (key: string) => {
    setExpandedTemas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Cargar estado de síntesis guardada en base de datos para la comisión actual
  const cargarSintesisGuardada = useCallback(async (comisionId: number | null) => {
    try {
      const url = comisionId
        ? `/api/admin/sintesis-ia?comisionId=${comisionId}`
        : "/api/admin/sintesis-ia";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        if (data.guardado) {
          setSintesis(data.guardado.sintesis);
          setSintesisGuardada({
            totalRespuestasAlGenerar: data.guardado.totalRespuestasAlGenerar,
            updatedAt: data.guardado.updatedAt,
          });
          setHayNuevasRespuestas(Boolean(data.hayNuevasRespuestas));
          setRespuestasNuevasCount(data.respuestasNuevasCount || 0);
          setVistaComentarios("sintesis");
        } else {
          setSintesis(null);
          setSintesisGuardada(null);
          setHayNuevasRespuestas(false);
          setRespuestasNuevasCount(0);
          setVistaComentarios("individuales");
        }
      }
    } catch (e) {
      console.error("Error al cargar síntesis guardada:", e);
    }
  }, []);

  // Invocar generación o recálculo de síntesis con IA
  const handleGenerarSintesis = async () => {
    try {
      setCargandoSintesis(true);
      setErrorSintesis(null);

      const res = await fetch("/api/admin/sintesis-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comisionId: selectedComisionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la síntesis con IA");
      }

      setSintesis(data.sintesis);
      setSintesisGuardada({
        totalRespuestasAlGenerar: data.totalRespuestasAlGenerar,
        updatedAt: data.updatedAt,
      });
      setHayNuevasRespuestas(false);
      setRespuestasNuevasCount(0);
      setVistaComentarios("sintesis");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al generar la síntesis con IA";
      setErrorSintesis(msg);
    } finally {
      setCargandoSintesis(false);
    }
  };

  const hayEncuestasAbiertas = comisiones.some((c) => c.activa);

  // Cargar comisiones (con soporte de silent para auto-refresh en vivo)
  const cargarComisiones = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingComisiones(true);
      const res = await fetch("/api/admin/comisiones");
      const data = await res.json();
      if (res.ok) {
        setComisiones(data.comisiones || []);
      }
    } catch (err) {
      console.error("Error al cargar comisiones:", err);
    } finally {
      if (!silent) setLoadingComisiones(false);
    }
  }, []);

  // Cargar docentes
  const cargarDocentes = useCallback(async () => {
    try {
      setLoadingDocentes(true);
      const res = await fetch("/api/admin/docentes");
      const data = await res.json();
      if (res.ok) {
        setDocentes(data.docentes || []);
      }
    } finally {
      setLoadingDocentes(false);
    }
  }, []);

  // Cargar estadísticas (con soporte de silent para auto-refresh en vivo)
  const cargarStats = useCallback(async (comisionId: number | null = null, silent = false) => {
    try {
      if (!silent) setLoadingStats(true);
      const url = comisionId
        ? `/api/admin/stats?comisionId=${comisionId}`
        : "/api/admin/stats";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      if (!silent) setLoadingStats(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    cargarComisiones();
    cargarDocentes();
    cargarStats();
    cargarSintesisGuardada(null);
  }, [cargarComisiones, cargarDocentes, cargarStats, cargarSintesisGuardada]);

  // Referencias para el polling en vivo sin recrear el temporizador
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const selectedComisionIdRef = useRef(selectedComisionId);
  useEffect(() => {
    selectedComisionIdRef.current = selectedComisionId;
  }, [selectedComisionId]);

  const cargarComisionesRef = useRef(cargarComisiones);
  cargarComisionesRef.current = cargarComisiones;

  const cargarStatsRef = useRef(cargarStats);
  cargarStatsRef.current = cargarStats;

  // Polling automático tipo cron:
  // - Activo automáticamente mientras haya al menos una encuesta abierta en clase.
  // - Pausa automática si la pestaña del navegador pasa a segundo plano (visibilidad oculta).
  // - Reanuda inmediatamente cuando el docente vuelve a la pestaña activa.
  useEffect(() => {
    if (!hayEncuestasAbiertas) return;

    let isFetching = false;

    const tick = async () => {
      // Pausa automática si la pestaña no está visible
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      if (isFetching) return;

      try {
        isFetching = true;
        // 1. Siempre refrescar comisiones para actualizar conteo de votos en vivo
        await cargarComisionesRef.current(true);

        // 2. Si el docente está en la pestaña de resultados, refrescar métricas y comentarios en vivo
        if (tabRef.current === "stats") {
          await cargarStatsRef.current(selectedComisionIdRef.current, true);
        }
      } catch (err) {
        console.error("Error en sincronización en vivo:", err);
      } finally {
        isFetching = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    // Consulta periódica cada 4 segundos
    const intervalId = setInterval(tick, 4000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hayEncuestasAbiertas]);

  // Manejar toggle de comisión (Habilitar / Cerrar)
  const toggleComision = async (id: number) => {
    setComisiones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activa: !c.activa } : c))
    );

    try {
      const res = await fetch(`/api/admin/comisiones/${id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) {
        await cargarComisiones();
      }
    } catch {
      await cargarComisiones();
    }
  };

  // Crear nueva comisión
  const handleCrearComision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setGuardandoComision(true);
    try {
      const res = await fetch("/api/admin/comisiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          materia: "Matemática Financiera",
          cicloLectivo: "2026",
          activa: nuevaActiva,
        }),
      });

      if (res.ok) {
        setShowNuevaModal(false);
        setNuevoNombre("");
        setNuevaActiva(true);
        await cargarComisiones();
      } else {
        const d = await res.json();
        alert(d.error || "Error al crear la comisión");
      }
    } catch {
      alert("Error al conectar con el servidor");
    } finally {
      setGuardandoComision(false);
    }
  };

  // Confirmar eliminación de comisión
  const handleConfirmarEliminarComision = async () => {
    if (!comisionAEliminar) return;
    setEliminandoComision(true);
    try {
      const res = await fetch(`/api/admin/comisiones/${comisionAEliminar.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedComisionId === comisionAEliminar.id) {
          setSelectedComisionId(null);
          await cargarStats(null);
        }
        setComisionAEliminar(null);
        await cargarComisiones();
      } else {
        const d = await res.json();
        alert(d.error || "Error al eliminar la comisión");
      }
    } catch {
      alert("Error de conexión al eliminar la comisión");
    } finally {
      setEliminandoComision(false);
    }
  };

  // Crear docente
  const handleCrearDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDocenteNombre.trim()) return;

    try {
      const res = await fetch("/api/admin/docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoDocenteNombre.trim(),
          rol: nuevoDocenteRol,
        }),
      });

      if (res.ok) {
        setNuevoDocenteNombre("");
        await cargarDocentes();
      }
    } catch {
      alert("Error al guardar docente");
    }
  };

  // Toggle docente
  const toggleDocente = async (id: number, activoActual: boolean) => {
    setDocentes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, activo: !activoActual } : d))
    );

    try {
      await fetch(`/api/admin/docentes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activoActual }),
      });
    } catch {
      await cargarDocentes();
    }
  };

  // Eliminar docente
  const eliminarDocente = async (id: number) => {
    if (!confirm("¿Deseas eliminar este docente del registro?")) return;

    try {
      const res = await fetch(`/api/admin/docentes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await cargarDocentes();
      }
    } catch {
      alert("Error al eliminar docente");
    }
  };

  // Descargar QR como PNG
  const descargarQR = async (codigo: string, nombre: string) => {
    try {
      const origin = window.location.origin;
      const fullUrl = `${origin}/encuesta/${codigo}`;
      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 600,
        margin: 2,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `QR_UNNE_${nombre.replace(/\s+/g, "_")}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  // Copiar link
  const copiarLink = (codigo: string) => {
    const origin = window.location.origin;
    const url = `${origin}/encuesta/${codigo}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Cerrar sesión
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const encuestasAbiertas = comisiones.filter((c) => c.activa);
  const encuestasCerradas = comisiones.filter((c) => !c.activa);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 pb-20">
      {/* Barra Superior Institucional */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <UnneLogo className="h-10 sm:h-11 w-auto" subtitulo="Cátedra: Matemática Financiera" />

          <div className="flex items-center gap-3">
            {hayEncuestasAbiertas && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                title="Sincronización en vivo activa (actualización automática sin recargar página)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>En vivo</span>
              </span>
            )}
            <span className="hidden sm:inline-block text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
              {adminName}
            </span>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-xl border border-stone-200 text-stone-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 sm:gap-6 border-t border-stone-100 overflow-x-auto">
          <button
            onClick={() => setTab("comisiones")}
            className={`py-3.5 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "comisiones"
                ? "border-[#18181B] text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Encuestas y Códigos QR</span>
            {encuestasAbiertas.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {encuestasAbiertas.length} activa{encuestasAbiertas.length > 1 ? "s" : ""}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setTab("stats");
              cargarStats(selectedComisionId);
              cargarSintesisGuardada(selectedComisionId);
            }}
            className={`py-3.5 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "stats"
                ? "border-[#18181B] text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Dashboard de Resultados</span>
          </button>

          <button
            onClick={() => setTab("docentes")}
            className={`py-3.5 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "docentes"
                ? "border-[#18181B] text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <Users className="w-4 h-4 text-stone-500" />
            <span>Plantel Docente ({docentes.length})</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* ========================================================= */}
        {/* TAB 1: CONTROL DE ENCUESTAS Y QR */}
        {/* ========================================================= */}
        {tab === "comisiones" && (
          <div className="space-y-8">
            {/* Cabecera de acción */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Control de Encuestas en el Aula
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Habilitá la encuesta al iniciar la clase y cerrala cuando finalice el tiempo autorizado.
                </p>
              </div>

              <button
                onClick={() => {
                  setNuevoNombre("");
                  setNuevaActiva(true);
                  setShowNuevaModal(true);
                }}
                className="py-3 px-5 bg-[#18181B] hover:bg-[#27272A] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 cursor-pointer self-start sm:self-auto transition"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Crear / Habilitar Encuesta</span>
              </button>
            </div>

            {/* SECCIÓN 1: ENCUESTAS ABIERTAS EN VIVO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  Encuestas Abiertas en Vivo ({encuestasAbiertas.length})
                </h3>
              </div>

              {encuestasAbiertas.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      No hay ninguna encuesta abierta en este momento
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Para que los estudiantes puedan responder con el código QR, hacé clic en el botón de arriba para habilitar una comisión.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {encuestasAbiertas.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-3xl border-2 border-emerald-400 p-6 shadow-md flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            RECIBIENDO RESPUESTAS
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                              {c.totalRespuestas} {c.totalRespuestas === 1 ? "voto" : "votos"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setComisionAEliminar(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eliminar encuesta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xl font-extrabold text-slate-900 pt-1">
                          {c.nombre}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {c.materia} • Ciclo Lectivo {c.cicloLectivo}
                        </p>
                      </div>

                      {/* Botón Gigante de Proyección y Botón de Cerrar */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/admin/proyectar/${c.codigoAcceso}`}
                          target="_blank"
                          className="w-full py-3.5 px-4 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <QrCode className="w-5 h-5 text-amber-400" />
                          <span>Proyectar Código QR en Pantalla Gigante</span>
                        </Link>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => toggleComision(c.id)}
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                          >
                            <Lock className="w-4 h-4 text-rose-600" />
                            <span>Cerrar Encuesta</span>
                          </button>

                          <button
                            onClick={() => copiarLink(c.codigoAcceso)}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                          >
                            {copiedCode === c.codigoAcceso ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">Link Copiado</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 text-slate-500" />
                                <span>Copiar Enlace</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: ENCUESTAS CERRADAS / HISTORIAL */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Historial de Encuestas Finalizadas / Cerradas ({encuestasCerradas.length})
              </h3>

              {encuestasCerradas.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay encuestas cerradas aún.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {encuestasCerradas.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {c.nombre}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Cerrada
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.totalRespuestas} respuestas registradas • Ciclo {c.cicloLectivo}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => toggleComision(c.id)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reabrir</span>
                        </button>

                        <button
                          onClick={() => descargarQR(c.codigoAcceso, c.nombre)}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                          title="Descargar QR en PNG"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>QR PNG</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedComisionId(c.id);
                            setTab("stats");
                            cargarStats(c.id);
                            cargarSintesisGuardada(c.id);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ver Métricas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setComisionAEliminar(c)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                          title="Eliminar encuesta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Crear / Habilitar Encuesta */}
        {showNuevaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Crear Nueva Encuesta / Comisión
                  </h3>
                </div>
                <button
                  onClick={() => setShowNuevaModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearComision} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre de la Comisión / Turno *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Comisión 3 - Turno Tarde"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Estado Inicial de la Encuesta
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNuevaActiva(true)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                        nuevaActiva
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold">Habilitar en vivo</span>
                      </div>
                      <p className="text-[11px] leading-tight text-slate-500">
                        Se abre inmediatamente para proyectar el QR y recibir respuestas.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNuevaActiva(false)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                        !nuevaActiva
                          ? "bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold">Crear cerrada</span>
                      </div>
                      <p className="text-[11px] leading-tight text-slate-500">
                        Queda guardada en historial para habilitarla cuando inicie la clase.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNuevaModal(false)}
                    disabled={guardandoComision}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoComision}
                    className="flex-1 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {guardandoComision ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Crear Encuesta</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminar Comisión */}
        {comisionAEliminar && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    ¿Eliminar encuesta?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estás a punto de borrar la comisión <strong>{comisionAEliminar.nombre}</strong>.
                  </p>
                </div>
              </div>

              {comisionAEliminar.totalRespuestas > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>¡Atención!</strong> Esta encuesta ya tiene <strong>{comisionAEliminar.totalRespuestas} respuestas</strong> registradas por los alumnos. Al eliminarla, se borrarán todas sus respuestas y evaluaciones asociadas de la base de datos de forma irreversible.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600">
                  Esta encuesta no tiene respuestas registradas. Será removida por completo del panel.
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setComisionAEliminar(null)}
                  disabled={eliminandoComision}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarEliminarComision}
                  disabled={eliminandoComision}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {eliminandoComision ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <span>Sí, eliminar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GESTIÓN DE DOCENTES */}
        {/* ========================================================= */}
        {tab === "docentes" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Cargar Nuevo Docente de la Cátedra
              </h2>
              <form
                onSubmit={handleCrearDocente}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Prof. Juan Pérez"
                    value={nuevoDocenteNombre}
                    onChange={(e) => setNuevoDocenteNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rol
                  </label>
                  <select
                    value={nuevoDocenteRol}
                    onChange={(e) =>
                      setNuevoDocenteRol(e.target.value as "teoria" | "practica" | "ambos")
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#0A2540] focus:outline-none bg-white"
                  >
                    <option value="teoria">Solo Teoría</option>
                    <option value="practica">Solo Práctica</option>
                    <option value="ambos">Ambos (Teoría y Práctica)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#18181B] hover:bg-[#27272A] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Guardar Docente</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Docentes Habilitados ({docentes.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Los docentes activos figuran automáticamente en las opciones de los alumnos.
                </span>
              </div>

              {loadingDocentes ? (
                <div className="p-8 text-center text-slate-400">Cargando docentes...</div>
              ) : docentes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay docentes cargados.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {docentes.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900">
                          {d.nombre}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            d.rol === "teoria"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : d.rol === "practica"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {d.rol === "ambos" ? "Teoría y Práctica" : d.rol}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDocente(d.id, d.activo)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                            d.activo
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {d.activo ? "Activo" : "Inactivo"}
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarDocente(d.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                          title="Eliminar docente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ESTADÍSTICAS Y RESULTADOS */}
        {/* ========================================================= */}
        {tab === "stats" && (
          <div className="space-y-6">
            {/* Barra de Filtro y Exportación */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ver Resultados de:
                </label>
                <select
                  value={selectedComisionId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    setSelectedComisionId(val);
                    cargarStats(val);
                    cargarSintesisGuardada(val);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                >
                  <option value="">Todas las comisiones (Consolidado)</option>
                  {comisiones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.totalRespuestas} respuestas)
                    </option>
                  ))}
                </select>

                {hayEncuestasAbiertas && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En vivo
                  </span>
                )}
              </div>

              <a
                href={
                  selectedComisionId
                    ? `/api/admin/export?comisionId=${selectedComisionId}`
                    : "/api/admin/export"
                }
                download
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Descargar Informe Excel (CSV)</span>
              </a>
            </div>

            {loadingStats ? (
              <div className="p-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0A2540]" />
                Calculando resultados...
              </div>
            ) : !stats || stats.total === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Aún no hay respuestas registradas para esta selección
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  A medida que los estudiantes completen la encuesta en clase con el código QR,
                  aquí verás las calificaciones promedio, análisis por docente y comentarios abiertos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Métricas Principales (1 al 5) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Respuestas
                    </span>
                    <span className="text-3xl font-black text-[#0A2540] mt-2">
                      {stats.total}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                      Ajuste al Programa
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">
                        {stats.promediosGenerales.ajustePrograma}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                      Bibliografía Útil
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">
                        {stats.promediosGenerales.bibliografiaUtil}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                      Coherencia Exámenes
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">
                        {stats.promediosGenerales.coherenciaExamenes}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                      Articulación T-P
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">
                        {stats.promediosGenerales.articulacionTeoriaPractica}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Métricas de Perfil del Alumno */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Situación Académica de los Estudiantes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-600 font-bold">
                        ¿Recursantes de la materia?
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {stats.demografia.recursantesPct}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stats.demografia.recursantesCount} de {stats.total} alumnos
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-600 font-bold">
                        ¿Conocimientos previos suficientes?
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {stats.demografia.conocimientosPreviosPct}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stats.demografia.conocimientosPreviosCount} de {stats.total} alumnos
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-600 font-bold">
                        ¿Practicó con parciales previos?
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {stats.demografia.practicoParcialesPct}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stats.demografia.practicoParcialesCount} de {stats.total} alumnos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desempeño por Docente */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Evaluación Individual por Docente
                  </h3>

                  {stats.evaluacionesPorDocente.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No hay registros de docentes evaluados en esta selección.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.evaluacionesPorDocente.map((doc, idx) => {
                        const tieneArticulacion = doc.tipoDocente === "practica" && doc.promedioArticulacion !== null && doc.promedioArticulacion !== undefined;
                        const cantItems = tieneArticulacion ? 4 : 3;
                        const sumaItems = doc.promedioClaridad + doc.promedioDisposicion + doc.promedioPuntualidad + (tieneArticulacion ? Number(doc.promedioArticulacion) : 0);
                        const promedioGeneral = Number((sumaItems / cantItems).toFixed(2));

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900">
                                  {doc.nombre}
                                </h4>
                                <span className="text-[10px] uppercase font-bold text-[#0A2540] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {doc.tipoDocente} • {doc.totalEvaluaciones} evaluaciones
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-black text-[#0A2540]">
                                  {promedioGeneral}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold block">/ 5.0</span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-200/60">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Claridad Pedagógica:</span>
                                <span className="font-bold">{doc.promedioClaridad} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#0A2540] h-full rounded-full"
                                  style={{ width: `${(doc.promedioClaridad / 5) * 100}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-1">
                                <span className="font-medium">Disposición a Consultas:</span>
                                <span className="font-bold">{doc.promedioDisposicion} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${(doc.promedioDisposicion / 5) * 100}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-1">
                                <span className="font-medium">Puntualidad y Cumplimiento:</span>
                                <span className="font-bold">{doc.promedioPuntualidad} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-600 h-full rounded-full"
                                  style={{ width: `${(doc.promedioPuntualidad / 5) * 100}%` }}
                                />
                              </div>

                              {tieneArticulacion && (
                                <>
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="font-medium">Articulación Teoría-Práctica:</span>
                                    <span className="font-bold">{doc.promedioArticulacion} / 5</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-600 h-full rounded-full"
                                      style={{ width: `${(Number(doc.promedioArticulacion) / 5) * 100}%` }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Respuestas Cualitativas y Síntesis Asistida por IA */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
                  {/* Cabecera del Módulo Cualitativo */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-600" />
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                          Respuestas Cualitativas y Sugerencias
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        {stats.comentarios.length} estudiante{stats.comentarios.length === 1 ? "" : "s"} aportaron observaciones de texto libre.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {sintesisGuardada ? (
                        hayNuevasRespuestas ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              +{respuestasNuevasCount} {respuestasNuevasCount === 1 ? "nueva respuesta" : "nuevas"}
                            </span>
                            <button
                              type="button"
                              onClick={handleGenerarSintesis}
                              disabled={cargandoSintesis || stats.comentarios.length === 0}
                              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                            >
                              {cargandoSintesis ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  <span>Recalculando...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-white" />
                                  <span>Recalcular Síntesis</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Al día ({sintesisGuardada.totalRespuestasAlGenerar} respuestas)</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleGenerarSintesis}
                              disabled={cargandoSintesis || stats.comentarios.length === 0}
                              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="Forzar recálculo con Gemini"
                            >
                              {cargandoSintesis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span>Recalcular</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerarSintesis}
                          disabled={cargandoSintesis || stats.comentarios.length === 0}
                          className="py-2.5 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {cargandoSintesis ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              <span>Analizando con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span>Generar Síntesis con IA</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selector de Vistas: Síntesis vs Individuales */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button
                      type="button"
                      onClick={() => setVistaComentarios("sintesis")}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        vistaComentarios === "sintesis"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Síntesis Inteligente</span>
                      {sintesis && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVistaComentarios("individuales")}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        vistaComentarios === "individuales"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ver Respuestas Individuales ({stats.comentarios.length})</span>
                    </button>
                  </div>

                  {/* Alerta de Error en Síntesis */}
                  {errorSintesis && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorSintesis}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerarSintesis}
                        className="text-xs font-bold underline hover:no-underline text-rose-900 cursor-pointer"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {/* VISTA 1: SÍNTESIS INTELIGENTE ASISTIDA POR IA */}
                  {vistaComentarios === "sintesis" && (
                    <>
                      {cargandoSintesis ? (
                        <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                          <h4 className="font-bold text-sm text-slate-800">
                            Procesando y agrupando comentarios con Gemini...
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Extrayendo patrones representativos, calculando porcentajes de mención y seleccionando citas textuales.
                          </p>
                        </div>
                      ) : !sintesis ? (
                        <div className="p-10 text-center space-y-3 bg-slate-50/60 rounded-3xl border border-dashed border-slate-300">
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">
                              Aún no has generado la síntesis con IA para esta selección
                            </h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                              Hacé clic en el botón superior para que el asistente clasifique los {stats.comentarios.length} comentarios de los alumnos en fortalezas, áreas de mejora y observaciones.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerarSintesis}
                            disabled={stats.comentarios.length === 0}
                            className="py-2.5 px-4 bg-[#18181B] hover:bg-[#27272A] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Generar Síntesis Ahora</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Banner de Nuevas Respuestas Disponibles */}
                          {sintesisGuardada && hayNuevasRespuestas && (
                            <div className="bg-amber-50/90 border-2 border-amber-300 text-amber-950 p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                              <div className="flex items-start gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-xs block text-amber-900">
                                    ¡Nuevas respuestas recibidas en el aula! ({sintesisGuardada.totalRespuestasAlGenerar} ➔ {stats.total} respuestas)
                                  </span>
                                  <p className="text-amber-800 text-[11px] mt-0.5">
                                    Se registraron <strong>{respuestasNuevasCount} {respuestasNuevasCount === 1 ? "nueva respuesta" : "nuevas respuestas"}</strong> desde el último análisis. Los resultados de abajo corresponden a la versión previa.
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleGenerarSintesis}
                                disabled={cargandoSintesis}
                                className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Recalcular con Nuevas Respuestas</span>
                              </button>
                            </div>
                          )}

                          {/* Diagnóstico / Resumen Ejecutivo */}
                          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                                Diagnóstico Pedagógico Ejecutivo
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                              "{sintesis.resumenEjecutivo}"
                            </p>
                          </div>

                          {/* Grid de Fortalezas y Oportunidades de Mejora */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Columna: Puntos Positivos */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                                  <span>Aspectos Más Valorados ({sintesis.aspectosPositivos.length})</span>
                                </h4>
                              </div>

                              <div className="space-y-3">
                                {sintesis.aspectosPositivos.map((item, idx) => {
                                  const key = `pos-${idx}`;
                                  const isExpanded = Boolean(expandedTemas[key]);
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5 transition"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-xs text-emerald-950">
                                          {item.tema}
                                        </h5>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                                          ~{item.porcentajeEstimado}% menciones
                                        </span>
                                      </div>

                                      <p className="text-xs text-slate-700 leading-snug">
                                        {item.descripcion}
                                      </p>

                                      {item.citas && item.citas.length > 0 && (
                                        <div className="pt-2 border-t border-emerald-200/60">
                                          <button
                                            type="button"
                                            onClick={() => toggleExpandTema(key)}
                                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                                          >
                                            {isExpanded ? (
                                              <>
                                                <ChevronUp className="w-3.5 h-3.5" />
                                                <span>Ocultar citas de alumnos ({item.citas.length})</span>
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                                <span>Ver citas textuales ({item.citas.length})</span>
                                              </>
                                            )}
                                          </button>

                                          {isExpanded && (
                                            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-400">
                                              {item.citas.map((cita, cIdx) => (
                                                <p
                                                  key={cIdx}
                                                  className="text-[11px] text-slate-700 italic"
                                                >
                                                  "{cita}"
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Columna: Oportunidades de Mejora */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                  <span>Aspectos a Mejorar y Ajustes ({sintesis.aspectosAMejorar.length})</span>
                                </h4>
                              </div>

                              <div className="space-y-3">
                                {sintesis.aspectosAMejorar.map((item, idx) => {
                                  const key = `mej-${idx}`;
                                  const isExpanded = Boolean(expandedTemas[key]);
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 transition"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-xs text-amber-950">
                                          {item.tema}
                                        </h5>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                                          ~{item.porcentajeEstimado}% menciones
                                        </span>
                                      </div>

                                      <p className="text-xs text-slate-700 leading-snug">
                                        {item.descripcion}
                                      </p>

                                      {item.sugerenciaAccion && (
                                        <div className="bg-white/80 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-950">
                                          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                          <div>
                                            <strong>Sugerencia de acción:</strong> {item.sugerenciaAccion}
                                          </div>
                                        </div>
                                      )}

                                      {item.citas && item.citas.length > 0 && (
                                        <div className="pt-2 border-t border-amber-200/60">
                                          <button
                                            type="button"
                                            onClick={() => toggleExpandTema(key)}
                                            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                                          >
                                            {isExpanded ? (
                                              <>
                                                <ChevronUp className="w-3.5 h-3.5" />
                                                <span>Ocultar citas de alumnos ({item.citas.length})</span>
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                                <span>Ver citas textuales ({item.citas.length})</span>
                                              </>
                                            )}
                                          </button>

                                          {isExpanded && (
                                            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-amber-400">
                                              {item.citas.map((cita, cIdx) => (
                                                <p
                                                  key={cIdx}
                                                  className="text-[11px] text-slate-700 italic"
                                                >
                                                  "{cita}"
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Fila: Observaciones y Sugerencias Misceláneas */}
                          {sintesis.observacionesGenerales && sintesis.observacionesGenerales.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-slate-500" />
                                <span>Otras Observaciones Destacadas</span>
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {sintesis.observacionesGenerales.map((obs, oIdx) => (
                                  <div key={oIdx} className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                                    <h6 className="font-bold text-xs text-slate-900">{obs.tema}</h6>
                                    <p className="text-[11px] text-slate-600">{obs.detalle}</p>
                                    {obs.citas && obs.citas.length > 0 && (
                                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                                        "{obs.citas[0]}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* VISTA 2: RESPUESTAS INDIVIDUALES CLÁSICAS */}
                  {vistaComentarios === "individuales" && (
                    <>
                      {stats.comentarios.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No hay comentarios o sugerencias abiertas registradas en este período.
                        </p>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
                          {stats.comentarios.map((c) => (
                            <div key={c.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                              <span className="font-bold text-slate-600 text-[11px]">
                                {c.comisionNombre} • {new Date(c.createdAt).toLocaleDateString("es-AR")}
                              </span>

                              {c.puntosPositivos && (
                                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                                  <span className="font-bold text-emerald-900 block text-[11px] mb-0.5">
                                    Puntos Positivos:
                                  </span>
                                  <p className="text-slate-800 italic">"{c.puntosPositivos}"</p>
                                </div>
                              )}

                              {c.aspectosAMejorar && (
                                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                                  <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                                    Aspectos a Mejorar:
                                  </span>
                                  <p className="text-slate-800 italic">"{c.aspectosAMejorar}"</p>
                                </div>
                              )}

                              {c.comentariosAdicionales && (
                                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                                  <span className="font-bold text-slate-700 block text-[11px] mb-0.5">
                                    Comentarios Adicionales:
                                  </span>
                                  <p className="text-slate-800 italic">"{c.comentariosAdicionales}"</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
