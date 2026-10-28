"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BarChart3,
  QrCode,
  LogOut,
  Plus,
  Check,
  X,
  ExternalLink,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Filter,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import QRCode from "qrcode";

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

export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"comisiones" | "docentes" | "stats">("comisiones");

  // Estado Comisiones
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loadingComisiones, setLoadingComisiones] = useState(true);
  const [showNuevaComisionModal, setShowNuevaComisionModal] = useState(false);
  const [formNuevaComision, setFormNuevaComision] = useState({
    nombre: "",
    materia: "Cátedra",
    cicloLectivo: "2026",
    codigoAcceso: "",
  });

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

  // Cargar comisiones
  const cargarComisiones = useCallback(async () => {
    try {
      setLoadingComisiones(true);
      const res = await fetch("/api/admin/comisiones");
      const data = await res.json();
      if (res.ok) {
        setComisiones(data.comisiones || []);
      }
    } finally {
      setLoadingComisiones(false);
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

  // Cargar estadísticas
  const cargarStats = useCallback(async (comisionId: number | null = null) => {
    try {
      setLoadingStats(true);
      const url = comisionId
        ? `/api/admin/stats?comisionId=${comisionId}`
        : "/api/admin/stats";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    cargarComisiones();
    cargarDocentes();
    cargarStats();
  }, [cargarComisiones, cargarDocentes, cargarStats]);

  // Manejar toggle de comisión
  const toggleComision = async (id: number) => {
    // Optimistic update
    setComisiones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activa: !c.activa } : c))
    );

    try {
      const res = await fetch(`/api/admin/comisiones/${id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) {
        // Revertir si falló
        await cargarComisiones();
      }
    } catch {
      await cargarComisiones();
    }
  };

  // Crear comisión
  const handleCrearComision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevaComision.nombre || !formNuevaComision.codigoAcceso) return;

    try {
      const res = await fetch("/api/admin/comisiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevaComision),
      });

      if (res.ok) {
        setShowNuevaComisionModal(false);
        setFormNuevaComision({
          nombre: "",
          materia: "Cátedra",
          cicloLectivo: "2026",
          codigoAcceso: "",
        });
        await cargarComisiones();
      } else {
        const d = await res.json();
        alert(d.error || "Error al crear comisión");
      }
    } catch {
      alert("Error al conectar con el servidor");
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
          nombre: nuevoDocenteNombre,
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

  // Toggle estado de docente
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
    if (!confirm("¿Seguro que deseas eliminar este docente?")) return;

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
      a.download = `QR_${codigo}_${nombre.replace(/\s+/g, "_")}.png`;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Panel de Cátedra
              </h1>
              <p className="text-xs text-slate-500">{adminName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setTab("comisiones")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "comisiones"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <QrCode className="w-4 h-4" /> Comisiones y Códigos QR
          </button>

          <button
            onClick={() => setTab("docentes")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "docentes"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" /> Gestión de Docentes
          </button>

          <button
            onClick={() => {
              setTab("stats");
              cargarStats(selectedComisionId);
            }}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
              tab === "stats"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Estadísticas y Resultados
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* ========================================================= */}
        {/* TAB 1: COMISIONES & CÓDIGOS QR */}
        {/* ========================================================= */}
        {tab === "comisiones" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Control de Encuestas por Comisión
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Habilitá o cerrá la recepción de respuestas al instante para que los alumnos
                  respondan en clase.
                </p>
              </div>

              <button
                onClick={() => setShowNuevaComisionModal(true)}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto transition"
              >
                <Plus className="w-4 h-4" /> Nueva Comisión
              </button>
            </div>

            {loadingComisiones ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Cargando comisiones...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {comisiones.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs p-5 flex flex-col justify-between space-y-4 ${
                      c.activa
                        ? "border-emerald-300 ring-1 ring-emerald-400/30"
                        : "border-slate-200 opacity-90"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.activa
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {c.activa ? "● Abierta (En vivo)" : "○ Cerrada"}
                        </span>

                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          {c.totalRespuestas} {c.totalRespuestas === 1 ? "respuesta" : "respuestas"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {c.nombre}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {c.materia} • Ciclo {c.cicloLectivo} • Código:{" "}
                        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {c.codigoAcceso}
                        </code>
                      </p>
                    </div>

                    {/* Switch de activación */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">
                        Estado de recepción:
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleComision(c.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer select-none ${
                          c.activa
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {c.activa ? (
                          <>
                            <ToggleRight className="w-4 h-4" /> Habilitada
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" /> Cerrada
                          </>
                        )}
                      </button>
                    </div>

                    {/* Acciones de Proyección y QR */}
                    <div className="pt-2 grid grid-cols-3 gap-1.5 text-xs">
                      <Link
                        href={`/admin/proyectar/${c.codigoAcceso}`}
                        target="_blank"
                        className="col-span-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <QrCode className="w-4 h-4 text-indigo-400" />
                        <span>Proyectar QR en Aula</span>
                      </Link>

                      <button
                        onClick={() => copiarLink(c.codigoAcceso)}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Copiar link directo"
                      >
                        {copiedCode === c.codigoAcceso ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>Link</>
                        )}
                      </button>

                      <button
                        onClick={() => descargarQR(c.codigoAcceso, c.nombre)}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Descargar imagen PNG del QR"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        <span>QR PNG</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComisionId(c.id);
                          setTab("stats");
                          cargarStats(c.id);
                        }}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Ver analíticas de esta comisión"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Métricas</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Nueva Comisión */}
        {showNuevaComisionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Crear Nueva Comisión
                </h3>
                <button
                  onClick={() => setShowNuevaComisionModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearComision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de la Comisión
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Comisión 3 - Turno Tarde"
                    value={formNuevaComision.nombre}
                    onChange={(e) =>
                      setFormNuevaComision({
                        ...formNuevaComision,
                        nombre: e.target.value,
                        codigoAcceso: formNuevaComision.codigoAcceso || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Materia
                    </label>
                    <input
                      type="text"
                      value={formNuevaComision.materia}
                      onChange={(e) =>
                        setFormNuevaComision({ ...formNuevaComision, materia: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ciclo Lectivo
                    </label>
                    <input
                      type="text"
                      value={formNuevaComision.cicloLectivo}
                      onChange={(e) =>
                        setFormNuevaComision({ ...formNuevaComision, cicloLectivo: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de acceso URL / QR (sin espacios)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: comision-3"
                    value={formNuevaComision.codigoAcceso}
                    onChange={(e) =>
                      setFormNuevaComision({
                        ...formNuevaComision,
                        codigoAcceso: e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    El link será: /encuesta/{formNuevaComision.codigoAcceso || "..."}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNuevaComisionModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                  >
                    Guardar Comisión
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GESTIÓN DE DOCENTES */}
        {/* ========================================================= */}
        {tab === "docentes" && (
          <div className="space-y-6">
            {/* Formulario de carga de docente */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Cargar Nuevo Docente a la Cátedra
              </h2>
              <form
                onSubmit={handleCrearDocente}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Prof. Juan Pérez"
                    value={nuevoDocenteNombre}
                    onChange={(e) => setNuevoDocenteNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol en la Cátedra
                  </label>
                  <select
                    value={nuevoDocenteRol}
                    onChange={(e) =>
                      setNuevoDocenteRol(e.target.value as "teoria" | "practica" | "ambos")
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="teoria">Solo Teoría</option>
                    <option value="practica">Solo Práctica</option>
                    <option value="ambos">Ambos (Teoría y Práctica)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar Docente
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de docentes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Docentes Registrados ({docentes.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Solo los docentes activos se mostrarán en el formulario estudiantil.
                </span>
              </div>

              {loadingDocentes ? (
                <div className="p-8 text-center text-slate-400">Cargando docentes...</div>
              ) : docentes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay docentes cargados aún.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {docentes.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {d.nombre}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              d.rol === "teoria"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : d.rol === "practica"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {d.rol === "ambos" ? "Teoría y Práctica" : d.rol}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDocente(d.id, d.activo)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                <label className="text-xs font-semibold text-slate-700">
                  Filtrar resultados por:
                </label>
                <select
                  value={selectedComisionId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    setSelectedComisionId(val);
                    cargarStats(val);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Todas las comisiones (Consolidado)</option>
                  {comisiones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <a
                href={
                  selectedComisionId
                    ? `/api/admin/export?comisionId=${selectedComisionId}`
                    : "/api/admin/export"
                }
                download
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Respuestas a Excel (CSV)</span>
              </a>
            </div>

            {loadingStats ? (
              <div className="p-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                Calculando métricas...
              </div>
            ) : !stats || stats.total === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Aún no hay respuestas registradas
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Cuando los alumnos completen la encuesta en vivo mediante el QR, aquí verás los
                  promedios consolidados, análisis por docente y comentarios abiertos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Métricas Principales (1 al 5) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Total Respuestas
                    </span>
                    <span className="text-3xl font-extrabold text-indigo-600 mt-2">
                      {stats.total}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                      Ajuste al Programa
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {stats.promediosGenerales.ajustePrograma}
                      </span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                      Bibliografía Útil
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {stats.promediosGenerales.bibliografiaUtil}
                      </span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                      Coherencia Exámenes
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {stats.promediosGenerales.coherenciaExamenes}
                      </span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                      Articulación Teoría-Práctica
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {stats.promediosGenerales.articulacionTeoriaPractica}
                      </span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Métricas de Perfil del Estudiante */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">
                    Situación Académica de los Estudiantes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">
                        ¿Recursantes de la materia?
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {stats.demografia.recursantesPct}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {stats.demografia.recursantesCount} de {stats.total} estudiantes
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">
                        ¿Conocimientos previos suficientes?
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {stats.demografia.conocimientosPreviosPct}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {stats.demografia.conocimientosPreviosCount} de {stats.total} estudiantes
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">
                        ¿Practicó con parciales previos?
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {stats.demografia.practicoParcialesPct}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {stats.demografia.practicoParcialesCount} de {stats.total} estudiantes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desempeño por Docente */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">
                    Evaluación Individual por Docente
                  </h3>

                  {stats.evaluacionesPorDocente.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No hay registros de docentes evaluados en esta selección.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.evaluacionesPorDocente.map((doc, idx) => {
                        const promedioGeneral = Number(
                          (
                            (doc.promedioClaridad +
                              doc.promedioDisposicion +
                              doc.promedioPuntualidad) /
                            3
                          ).toFixed(2)
                        );

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">
                                  {doc.nombre}
                                </h4>
                                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  {doc.tipoDocente} • {doc.totalEvaluaciones} alumnos
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-extrabold text-indigo-700">
                                  {promedioGeneral}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ 5.0</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-200/60">
                              <div className="flex justify-between items-center">
                                <span>Claridad Pedagógica:</span>
                                <span className="font-bold">{doc.promedioClaridad} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${(doc.promedioClaridad / 5) * 100}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-1">
                                <span>Disposición a Consultas:</span>
                                <span className="font-bold">{doc.promedioDisposicion} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${(doc.promedioDisposicion / 5) * 100}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-1">
                                <span>Puntualidad y Cumplimiento:</span>
                                <span className="font-bold">{doc.promedioPuntualidad} / 5</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-600 h-full rounded-full"
                                  style={{ width: `${(doc.promedioPuntualidad / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Respuestas Cualitativas / Abiertas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Respuestas Cualitativas y Sugerencias de los Estudiantes
                  </h3>

                  {stats.comentarios.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No hay comentarios o sugerencias abiertas registradas.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
                      {stats.comentarios.map((c) => (
                        <div key={c.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                          <span className="font-bold text-slate-500 text-[11px]">
                            {c.comisionNombre} • {new Date(c.createdAt).toLocaleDateString("es-AR")}
                          </span>

                          {c.puntosPositivos && (
                            <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                              <span className="font-bold text-emerald-800 block text-[11px] mb-0.5">
                                Puntos Positivos:
                              </span>
                              <p className="text-slate-800 italic">"{c.puntosPositivos}"</p>
                            </div>
                          )}

                          {c.aspectosAMejorar && (
                            <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl">
                              <span className="font-bold text-amber-800 block text-[11px] mb-0.5">
                                Aspectos a Mejorar:
                              </span>
                              <p className="text-slate-800 italic">"{c.aspectosAMejorar}"</p>
                            </div>
                          )}

                          {c.comentariosAdicionales && (
                            <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
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
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
