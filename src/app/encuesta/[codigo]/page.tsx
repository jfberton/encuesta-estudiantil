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
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-md border border-slate-200 space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Encuesta Cerrada
            </span>
            <h1 className="text-xl font-bold text-slate-900 pt-1">
              La encuesta se encuentra fuera de horario
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              La recepción de respuestas para <strong>{comision.nombre}</strong> está
              cerrada o aún no fue habilitada por los docentes a cargo.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            Si estás en clase, aguardá la indicación del profesor para escanear el código QR
            nuevamente.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100/70 pb-16">
      <EncuestaForm
        comision={comision}
        docentesTeoria={docentesTeoria}
        docentesPractica={docentesPractica}
      />
    </main>
  );
}
