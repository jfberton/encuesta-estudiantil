import React from "react";

interface UnneLogoProps {
  className?: string;
  subtitulo?: string;
  showFaculty?: boolean;
}

export function UnneLogo({
  className = "h-10 sm:h-12 w-auto",
  subtitulo,
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

      <div className="h-8 w-px bg-slate-200 hidden sm:block" />

      {/* Logo Facultad de Ciencias Económicas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fce-logo.png"
        alt="Facultad de Ciencias Económicas"
        className="h-10 sm:h-12 w-auto object-contain"
      />

      {subtitulo && (
        <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-1.5 sm:pt-0 sm:pl-3 text-center sm:text-left">
          <span className="text-[11px] sm:text-xs font-bold text-amber-700 tracking-normal uppercase">
            {subtitulo}
          </span>
        </div>
      )}
    </div>
  );
}
