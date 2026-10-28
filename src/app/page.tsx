import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GraduationCap, ShieldCheck, ArrowRight, QrCode, Lock } from "lucide-react";

export default async function HomePage() {
  const comisionesActivas = await db
    .select({
      id: comisiones.id,
      nombre: comisiones.nombre,
      materia: comisiones.materia,
      codigoAcceso: comisiones.codigoAcceso,
      cicloLectivo: comisiones.cicloLectivo,
    })
    .from(comisiones)
    .where(eq(comisiones.activa, true));

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Cabecera */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">
              Cátedra Universitaria
            </span>
            <span className="text-[11px] text-slate-400">
              Sistema de Encuestas Estudiantiles
            </span>
          </div>
        </div>

        <Link
          href="/admin"
          className="py-2 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
        >
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Panel Docente</span>
        </Link>
      </header>

      {/* Contenido Central */}
      <section className="max-w-2xl mx-auto w-full text-center space-y-6 my-auto py-12 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <ShieldCheck className="w-4 h-4" /> 100% Anónima y Confidencial
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Tu opinión impulsa la mejora continua de la cátedra
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
          Evaluá de manera transparente y confidencial el desempeño docente, los
          contenidos de la materia y el desarrollo del ciclo lectivo.
        </p>

        {/* Comisiones Activas en Vivo */}
        <div className="pt-4 max-w-md mx-auto space-y-3 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Comisiones con encuesta abierta en este momento:</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> En vivo
            </span>
          </div>

          {comisionesActivas.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 text-center text-xs text-slate-400">
              No hay encuestas habilitadas en este instante. Escaneá el código QR que tu
              profesor proyecte en el aula cuando comience la votación.
            </div>
          ) : (
            <div className="space-y-2">
              {comisionesActivas.map((c) => (
                <Link
                  key={c.id}
                  href={`/encuesta/${c.codigoAcceso}`}
                  className="group block bg-slate-800/90 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-4 transition duration-150 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                        {c.nombre}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {c.materia} • Ciclo {c.cicloLectivo}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-700/60 group-hover:bg-indigo-600 flex items-center justify-center text-slate-300 group-hover:text-white transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pie */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 pt-6 border-t border-slate-800/80 z-10">
        Encuesta de Opinión Estudiantil • Desarrollado para uso académico en vivo
      </footer>
    </main>
  );
}
