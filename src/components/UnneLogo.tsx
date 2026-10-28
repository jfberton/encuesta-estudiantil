import React from "react";

interface UnneLogoProps {
  className?: string;
  subtitulo?: string;
  tituloFacultad?: string;
}

export function UnneLogo({
  className = "h-10 sm:h-11 w-auto",
  subtitulo = "Cátedra: Matemática Financiera",
  tituloFacultad = "Facultad de Ciencias Económicas",
}: UnneLogoProps) {
  return (
    <div className="flex items-center gap-3 select-none flex-wrap sm:flex-nowrap justify-center sm:justify-start">
      {/* Logo UNNE */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/unne-logo.png"
        alt="Universidad Nacional del Nordeste"
        className={`${className} object-contain`}
      />

      {/* Separador vertical */}
      <div className="h-9 w-px bg-slate-200 hidden sm:block" />

      {/* Logo redondo FCE sin texto */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fce-round.png"
        alt="Facultad de Ciencias Económicas"
        className="h-10 sm:h-11 w-auto object-contain"
      />

      {/* Tipografía Institucional legible */}
      <div className="flex flex-col justify-center text-left">
        <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
          {tituloFacultad}
        </span>
        <span className="text-[11px] sm:text-xs font-semibold text-amber-700 tracking-normal mt-0.5">
          {subtitulo}
        </span>
      </div>
    </div>
  );
}
