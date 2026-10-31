"use client";

import React from "react";

interface SwitchButtonsProps {
  value: boolean | null | undefined;
  onChange: (val: boolean) => void;
  readOnly?: boolean;
}

export function SwitchButtons({
  value,
  onChange,
  readOnly = false,
}: SwitchButtonsProps) {
  const isYes = value === true;
  const isNo = value === false;

  return (
    <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(true)}
        className={`
          py-2 px-4 rounded-xl text-xs sm:text-sm border transition-all duration-150 flex items-center justify-center gap-1.5 select-none
          ${
            isYes
              ? "bg-emerald-600 text-white font-bold border-emerald-600 scale-[1.02] shadow-xs"
              : "bg-white text-stone-700 font-normal border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70"
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
          py-2 px-4 rounded-xl text-xs sm:text-sm border transition-all duration-150 flex items-center justify-center gap-1.5 select-none
          ${
            isNo
              ? "bg-rose-500 text-white font-bold border-rose-500 scale-[1.02] shadow-xs"
              : "bg-white text-stone-700 font-normal border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70"
          }
          ${readOnly ? "cursor-default opacity-85" : "active:scale-[0.98] cursor-pointer"}
        `}
      >
        <span>✕</span> No
      </button>
    </div>
  );
}
