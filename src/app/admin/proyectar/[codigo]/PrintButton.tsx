"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer print:hidden"
    >
      <Printer className="w-4 h-4 text-amber-400" />
      <span>Imprimir / Guardar en PDF</span>
    </button>
  );
}
