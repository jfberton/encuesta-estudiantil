"use client";

import React from "react";

interface RatingBarProps {
  value: number | null | undefined;
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
    if (!isSelected) {
      return "bg-white text-stone-700 font-normal border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70";
    }

    switch (num) {
      case 1:
        return "bg-rose-500 text-white border-rose-500 font-bold scale-[1.03] shadow-xs";
      case 2:
        return "bg-orange-400 text-white border-orange-400 font-bold scale-[1.03] shadow-xs";
      case 3:
        return "bg-amber-400 text-stone-900 border-amber-400 font-bold scale-[1.03] shadow-xs";
      case 4:
        return "bg-emerald-500 text-white border-emerald-500 font-bold scale-[1.03] shadow-xs";
      case 5:
        return "bg-emerald-600 text-white border-emerald-600 font-bold scale-[1.03] shadow-xs";
      default:
        return "bg-stone-900 text-white border-stone-900 font-bold scale-[1.03] shadow-xs";
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {options.map((num) => {
          const isSelected = value !== null && value !== undefined && value === num;
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
