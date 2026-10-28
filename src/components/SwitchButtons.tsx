"use client";

import React from "react";

interface SwitchButtonsProps {
  value: boolean;
  onChange: (val: boolean) => void;
  readOnly?: boolean;
}

export function SwitchButtons({
  value,
  onChange,
  readOnly = false,
}: SwitchButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(true)}
        className={`
          py-2 px-4 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 select-none
          ${
            value === true
              ? "bg-[#18181B] text-white font-semibold border border-[#18181B] shadow-xs"
              : "bg-white text-stone-700 font-normal border border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70"
          }
          ${readOnly ? "cursor-default opacity-85" : "active:scale-[0.98] cursor-pointer"}
        `}
      >
        <span>✓</span> Sí
      </button>

      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(false)}
        className={`
          py-2 px-4 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 select-none
          ${
            value === false
              ? "bg-[#18181B] text-white font-semibold border border-[#18181B] shadow-xs"
              : "bg-white text-stone-700 font-normal border border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70"
          }
          ${readOnly ? "cursor-default opacity-85" : "active:scale-[0.98] cursor-pointer"}
        `}
      >
        <span>✕</span> No
      </button>
    </div>
  );
}
