import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { UnneLogo } from "@/components/UnneLogo";

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
    <main className="min-h-screen bg-[#071728] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Glow de fondo institucional */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Cabecera Institucional */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
        <UnneLogo variant="dark" className="h-11 w-auto" />

        <Link
          href="/admin"
          className="py-2 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Acceso Cátedra</span>
        </Link>
      </header>

      {/* Contenido Central */}
      <section className="max-w-2xl mx-auto w-full text-center space-y-6 my-auto py-10 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> Encuesta Estudiantil Anónima
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Matemática Financiera
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-300">
            Facultad de Ciencias Económicas • UNNE
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Tu opinión sincera y constructiva durante este ciclo lectivo nos ayuda a seguir
          perfeccionando la dinámica pedagógica, los materiales de estudio y las clases prácticas.
        </p>

        {/* Comisiones Activas en Vivo */}
        <div className="pt-4 max-w-md mx-auto space-y-3 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Comisiones habilitadas en vivo:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Recibiendo
            </span>
          </div>

          {comisionesActivas.length === 0 ? (
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-5 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">No hay encuestas abiertas en este momento.</p>
              <p>Escaneá el código QR proyectado en clase por tu docente para responder.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {comisionesActivas.map((c) => (
                <Link
                  key={c.id}
                  href={`/encuesta/${c.codigoAcceso}`}
                  className="group block bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded-2xl p-4 transition duration-150 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                        {c.nombre}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {c.materia || "Matemática Financiera"} • Ciclo {c.cicloLectivo}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-700/80 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition">
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
        Universidad Nacional del Nordeste (UNNE) • Facultad de Ciencias Económicas • Resistencia / Corrientes
      </footer>
    </main>
  );
}
