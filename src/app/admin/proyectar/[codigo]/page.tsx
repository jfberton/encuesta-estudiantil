import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function ProyectarPage({ params }: PageProps) {
  const { codigo } = await params;

  const [comision] = await db
    .select()
    .from(comisiones)
    .where(eq(comisiones.codigoAcceso, codigo))
    .limit(1);

  if (!comision) {
    notFound();
  }

  // Generar data URL del QR
  // Si estamos en local, la URL será relativa o basada en host
  const surveyUrl = `/encuesta/${comision.codigoAcceso}`;
  const qrSvg = await QRCode.toString(surveyUrl, {
    type: "svg",
    width: 380,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            comision.activa
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          }`}
        >
          {comision.activa ? "● Encuesta Abierta" : "○ Encuesta Cerrada"}
        </span>
      </div>

      {/* Contenido Central */}
      <div className="max-w-xl mx-auto w-full text-center space-y-6 my-auto py-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Encuesta Anónima Estudiantil
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {comision.nombre}
          </h1>
          <p className="text-sm text-slate-400">
            {comision.materia} • Ciclo Lectivo {comision.cicloLectivo}
          </p>
        </div>

        {/* Contenedor del QR */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl inline-block border-4 border-indigo-500/20">
          <div
            className="w-64 h-64 sm:w-80 sm:h-80 mx-auto"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-base sm:text-lg font-medium text-slate-200">
            Escaneá el código QR con la cámara de tu celular para responder
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <span>Link directo: /encuesta/{comision.codigoAcceso}</span>
            <Link
              href={`/encuesta/${comision.codigoAcceso}`}
              target="_blank"
              className="text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="text-center text-xs text-slate-500">
        Las respuestas son 100% anónimas y se reciben únicamente durante la clase.
      </div>
    </main>
  );
}
