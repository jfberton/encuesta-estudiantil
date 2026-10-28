import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { UnneLogo } from "@/components/UnneLogo";

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

  const surveyUrl = `/encuesta/${comision.codigoAcceso}`;
  const qrSvg = await QRCode.toString(surveyUrl, {
    type: "svg",
    width: 380,
    margin: 2,
    color: {
      dark: "#0A2540",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-[#071728] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Glow institucional */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Barra superior */}
      <div className="flex items-center justify-between z-10 border-b border-slate-800 pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" /> Volver al Panel Docente
        </Link>
        <UnneLogo variant="dark" className="h-9 w-auto" />
      </div>

      {/* Contenido Central para Proyectar */}
      <div className="max-w-xl mx-auto w-full text-center space-y-6 my-auto py-8 z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Encuesta Anónima Estudiantil
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {comision.nombre}
          </h1>
          <p className="text-sm font-semibold text-slate-300">
            Cátedra Matemática Financiera • FCE - UNNE
          </p>
          <span className="inline-block mt-1 text-xs text-slate-400">
            Ciclo Lectivo {comision.cicloLectivo}
          </span>
        </div>

        {/* Contenedor del QR con marco dorado institucional */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl inline-block border-4 border-amber-400/40">
          <div
            className="w-64 h-64 sm:w-80 sm:h-80 mx-auto"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-base sm:text-lg font-bold text-slate-100">
            Escaneá con la cámara de tu celular para responder la encuesta
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-700 shadow-md">
            <span>Link directo: /encuesta/{comision.codigoAcceso}</span>
            <Link
              href={`/encuesta/${comision.codigoAcceso}`}
              target="_blank"
              className="text-amber-400 hover:text-amber-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="text-center text-xs text-slate-500 z-10 border-t border-slate-800/80 pt-4">
        Las respuestas son 100% anónimas y se reciben únicamente durante este horario de clase.
      </div>
    </main>
  );
}
