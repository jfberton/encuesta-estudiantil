"use client";

import React from "react";

interface RatingBarProps {
  value: number;
  onChange: (val: number) => void;
  readOnly?: boolean;
  labelMin?: string;
  labelMax?: string;
}

export function RatingBar({
  value,
  onChange,
  readOnly = false,
  labelMin = "1 (Muy en desacuerdo / Deficiente)",
  labelMax = "5 (Muy de acuerdo / Excelente)",
}: RatingBarProps) {
  const options = [1, 2, 3, 4, 5];

  return (
    <div className="w-full space-y-1.5">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {options.map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(num)}
              className={`
                h-12 sm:h-11 rounded-xl font-bold text-base transition-all duration-150 flex items-center justify-center select-none
                ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02] ring-2 ring-indigo-400"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                }
                ${readOnly ? "cursor-default opacity-90" : "active:scale-95 cursor-pointer"}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-slate-500 px-1 select-none">
        <span>{labelMin}</span>
        <span>{labelMax}</span>
      </div>
    </div>
  );
}
