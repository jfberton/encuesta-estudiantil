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

  const getColorClasses = (num: number, isSelected: boolean) => {
    switch (num) {
      case 1:
        return isSelected
          ? "bg-rose-500 text-white border-rose-500 font-bold scale-[1.03] shadow-xs"
          : "bg-rose-50/40 text-rose-900/80 border-rose-200/70 hover:bg-rose-100/60 hover:border-rose-300";
      case 2:
        return isSelected
          ? "bg-orange-400 text-white border-orange-400 font-bold scale-[1.03] shadow-xs"
          : "bg-orange-50/40 text-orange-900/80 border-orange-200/70 hover:bg-orange-100/60 hover:border-orange-300";
      case 3:
        return isSelected
          ? "bg-amber-400 text-stone-900 border-amber-400 font-bold scale-[1.03] shadow-xs"
          : "bg-amber-50/40 text-amber-900/80 border-amber-200/70 hover:bg-amber-100/60 hover:border-amber-300";
      case 4:
        return isSelected
          ? "bg-emerald-500 text-white border-emerald-500 font-bold scale-[1.03] shadow-xs"
          : "bg-emerald-50/40 text-emerald-900/80 border-emerald-200/70 hover:bg-emerald-100/60 hover:border-emerald-300";
      case 5:
        return isSelected
          ? "bg-emerald-600 text-white border-emerald-600 font-bold scale-[1.03] shadow-xs"
          : "bg-emerald-50/70 text-emerald-900/80 border-emerald-300/80 hover:bg-emerald-100/70 hover:border-emerald-400";
      default:
        return "";
    }
  };

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
                h-11 sm:h-10 rounded-xl text-sm border transition-all duration-150 flex items-center justify-center select-none
                ${getColorClasses(num, isSelected)}
                ${readOnly ? "cursor-default opacity-85" : "active:scale-[0.98] cursor-pointer"}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-stone-400 font-normal px-0.5 select-none">
        <span>{labelMin}</span>
        <span>{labelMax}</span>
      </div>
    </div>
  );
}
