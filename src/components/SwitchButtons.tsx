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
          py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 select-none
          ${
            value === true
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-400"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }
          ${readOnly ? "cursor-default opacity-90" : "active:scale-95 cursor-pointer"}
        `}
      >
        <span>✓</span> Sí
      </button>

      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(false)}
        className={`
          py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 select-none
          ${
            value === false
              ? "bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-400"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }
          ${readOnly ? "cursor-default opacity-90" : "active:scale-95 cursor-pointer"}
        `}
      >
        <span>✕</span> No
      </button>
    </div>
  );
}
