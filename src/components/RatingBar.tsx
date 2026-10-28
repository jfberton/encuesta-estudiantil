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
      <div className="grid grid-cols-5 gap-2">
        {options.map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(num)}
              className={`
                h-11 sm:h-10 rounded-xl text-sm transition-all duration-150 flex items-center justify-center select-none
                ${
                  isSelected
                    ? "bg-[#18181B] text-white font-semibold border border-[#18181B] shadow-xs"
                    : "bg-white text-stone-700 font-normal border border-stone-200/90 hover:border-stone-400 hover:bg-stone-50/70"
                }
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
