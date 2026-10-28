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

  let comision = null;
  try {
    const [c] = await db
      .select()
      .from(comisiones)
      .where(eq(comisiones.codigoAcceso, codigo))
      .limit(1);
    comision = c;
  } catch (err) {
    console.error("Error al obtener comision para proyectar:", err);
  }

  if (!comision) {
    notFound();
  }

  const surveyUrl = `/encuesta/${comision.codigoAcceso}`;
  const qrSvg = await QRCode.toString(surveyUrl, {
    type: "svg",
    width: 400,
    margin: 2,
    color: {
      dark: "#0A2540",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-6 sm:p-10">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0A2540] transition"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" /> Volver al Panel Docente
        </Link>
        <UnneLogo className="h-10 w-auto" subtitulo="Cátedra Matemática Financiera" />
      </div>

      {/* Contenido Central para Proyectar */}
      <div className="max-w-xl mx-auto w-full text-center space-y-6 my-auto py-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Encuesta Anónima Estudiantil
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {comision.nombre}
          </h1>
          <p className="text-sm font-bold text-amber-700">
            Matemática Financiera • Facultad de Ciencias Económicas (UNNE)
          </p>
          <span className="inline-block mt-0.5 text-xs text-slate-500 font-semibold">
            Ciclo Lectivo {comision.cicloLectivo}
          </span>
        </div>

        {/* Contenedor del QR gigante */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl inline-block border-2 border-slate-200/90">
          <div
            className="w-64 h-64 sm:w-80 sm:h-80 mx-auto"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="space-y-2.5">
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            Escaneá con la cámara de tu celular para responder la encuesta
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 font-mono bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
            <span>Link directo: /encuesta/{comision.codigoAcceso}</span>
            <Link
              href={`/encuesta/${comision.codigoAcceso}`}
              target="_blank"
              className="text-[#0A2540] hover:text-blue-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
        Las respuestas son 100% anónimas y se reciben únicamente durante este horario de clase.
      </div>
    </main>
  );
}
