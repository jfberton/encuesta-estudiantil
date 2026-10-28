import React from "react";
import Image from "next/image";

interface UnneLogoProps {
  className?: string;
  subtitulo?: string;
  showFaculty?: boolean;
}

export function UnneLogo({
  className = "h-12 w-auto",
  subtitulo,
  showFaculty = true,
}: UnneLogoProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 select-none text-center sm:text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/unne-logo.png"
        alt="Universidad Nacional del Nordeste"
        className={className}
        style={{ objectFit: "contain" }}
      />
      {showFaculty && (
        <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
          <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
            Facultad de Ciencias Económicas
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-amber-700 tracking-normal">
            {subtitulo || "Cátedra Matemática Financiera"}
          </span>
        </div>
      )}
    </div>
  );
}
