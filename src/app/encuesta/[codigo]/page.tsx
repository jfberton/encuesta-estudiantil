import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { comisiones, docentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EncuestaForm } from "./EncuestaForm";
import { Clock, ShieldAlert, GraduationCap } from "lucide-react";

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function EncuestaPage({ params }: PageProps) {
  const { codigo } = await params;

  const [comision] = await db
    .select()
    .from(comisiones)
    .where(eq(comisiones.codigoAcceso, codigo))
    .limit(1);

  if (!comision) {
    notFound();
  }

  // Traer docentes activos
  const todosDocentes = await db
    .select({
      id: docentes.id,
      nombre: docentes.nombre,
      rol: docentes.rol,
    })
    .from(docentes)
    .where(eq(docentes.activo, true));

  const docentesTeoria = todosDocentes.filter(
    (d) => d.rol === "teoria" || d.rol === "ambos"
  );
  const docentesPractica = todosDocentes.filter(
    (d) => d.rol === "practica" || d.rol === "ambos"
  );

  // Si la comisión no está activa (cerrada fuera de horario)
  if (!comision.activa) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F5]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-200/70 space-y-5">
          <div className="w-14 h-14 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider bg-stone-100 px-3 py-1 rounded-full border border-stone-200/60">
              Encuesta Cerrada
            </span>
            <h1 className="text-xl font-bold text-stone-900 pt-1">
              La encuesta se encuentra fuera de horario
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed font-normal">
              La recepción de respuestas para <strong>{comision.nombre}</strong> está
              cerrada o aún no fue habilitada por los docentes a cargo.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 text-xs text-stone-500 font-normal">
            Si estás en clase, aguardá la indicación del profesor para escanear el código QR
            nuevamente.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F5] pb-16">
      <EncuestaForm
        comision={comision}
        docentesTeoria={docentesTeoria}
        docentesPractica={docentesPractica}
      />
    </main>
  );
}
