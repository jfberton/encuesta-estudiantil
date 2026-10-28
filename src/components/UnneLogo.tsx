import React from "react";

interface UnneLogoProps {
  className?: string;
  variant?: "light" | "dark" | "color";
  showText?: boolean;
}

export function UnneLogo({
  className = "h-12 w-auto",
  variant = "color",
  showText = true,
}: UnneLogoProps) {
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const subtextColor = isDark ? "text-slate-300" : "text-slate-600";
  const facultyColor = isDark ? "text-amber-400" : "text-amber-600";

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Isotipo UNNE: Sol Dorado con letra U estilizada institucional */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="50" cy="50" r="48" fill={isDark ? "#0f172a" : "#0A2540"} stroke="#D4AF37" strokeWidth="2.5" />
        
        {/* Rayos del sol dorado institucional */}
        <g stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
          <line x1="50" y1="14" x2="50" y2="8" />
          <line x1="68" y1="21" x2="73" y2="17" />
          <line x1="81" y1="38" x2="87" y2="36" />
          <line x1="32" y1="21" x2="27" y2="17" />
          <line x1="19" y1="38" x2="13" y2="36" />
        </g>
        
        {/* Sol */}
        <circle cx="50" cy="30" r="10" fill="#F59E0B" stroke="#D4AF37" strokeWidth="1.5" />

        {/* 'U' característica institucional */}
        <path
          d="M32 38 V 62 C 32 72, 68 72, 68 62 V 38"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Letra N N E interior estilizada o base */}
        <path
          d="M26 80 H 74"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className={`text-[13px] sm:text-sm font-extrabold tracking-wide uppercase ${textColor}`}>
            UNNE
          </span>
          <span className={`text-[10px] sm:text-[11px] font-semibold tracking-tight ${subtextColor}`}>
            Universidad Nacional del Nordeste
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold ${facultyColor} tracking-tight`}>
            Facultad de Ciencias Económicas
          </span>
        </div>
      )}
    </div>
  );
}
