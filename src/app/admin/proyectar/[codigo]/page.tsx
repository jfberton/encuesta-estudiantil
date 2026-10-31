import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { UnneLogo } from "@/components/UnneLogo";
import { PrintButton } from "./PrintButton";

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
    width: 320,
    margin: 1,
    color: {
      dark: "#0A2540",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8 print:p-0 print:bg-white print:min-h-0">
      {/* Barra superior (oculta al imprimir) */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0A2540] transition"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" /> Volver al Panel Docente
        </Link>
        <div className="flex items-center gap-4">
          <PrintButton />
          <UnneLogo className="h-9 w-auto" subtitulo="Cátedra: Matemática Financiera" />
        </div>
      </header>

      {/* Membrete para impresión PDF */}
      <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-slate-300 pb-4 mb-6 text-center">
        <UnneLogo className="h-14 w-auto mb-2" subtitulo="Facultad de Ciencias Económicas" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Cátedra: Matemática Financiera • Ciclo Lectivo {comision.cicloLectivo}
        </p>
      </div>

      {/* Contenido Central: Proyección y Móvil */}
      <div className="max-w-md sm:max-w-xl mx-auto w-full text-center space-y-5 my-auto py-4 sm:py-8 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-emerald-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Encuesta Anónima Estudiantil
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {comision.nombre}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-700">
            Matemática Financiera • Facultad de Ciencias Económicas (UNNE)
          </p>
          <span className="inline-block text-xs text-slate-500 font-semibold">
            Ciclo Lectivo {comision.cicloLectivo}
          </span>
        </div>

        {/* Tarjeta del Código QR: Totalmente responsiva y sin desbordes */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg border-2 border-slate-200/90 inline-block max-w-[92vw] sm:max-w-none print:shadow-none print:border-2 print:border-slate-800">
          <div
            className="w-56 h-56 sm:w-72 sm:h-72 mx-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        {/* Instrucciones y Enlace Directo */}
        <div className="space-y-3 px-2">
          <p className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug">
            Escaneá con la cámara de tu celular para responder la encuesta
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs max-w-full truncate print:border-slate-400">
            <span className="truncate">/encuesta/{comision.codigoAcceso}</span>
            <Link
              href={`/encuesta/${comision.codigoAcceso}`}
              target="_blank"
              className="text-[#0A2540] hover:text-blue-800 print:hidden shrink-0"
              title="Abrir encuesta"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pie */}
      <footer className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4 print:text-slate-600 print:border-slate-300">
        Las respuestas son 100% anónimas y se reciben únicamente durante este horario de clase.
      </footer>
    </main>
  );
}
