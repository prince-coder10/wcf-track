"use client";

import { UNIVERSITY_HALLS } from "../types";
import { ChevronDown } from "lucide-react";

interface HallSelectProps {
  hall: string;
  onHallChange: (val: string) => void;
  customHall: string;
  onCustomHallChange: (val: string) => void;
}

export default function HallSelect({
  hall,
  onHallChange,
  customHall,
  onCustomHallChange,
}: HallSelectProps) {
  const isOther = hall === "Other (specify below)";

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-bold text-slate-900">
        Hall of residence <span className="text-rose-600">*</span>
      </label>

      <div className="relative">
        <select
          value={hall}
          onChange={(e) => onHallChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition cursor-pointer shadow-sm"
        >
          <option value="" className="text-slate-400">Select hall</option>
          {UNIVERSITY_HALLS.map((h) => (
            <option key={h} value={h} className="text-slate-900">
              {h}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none stroke-[2.5]" />
      </div>

      {isOther && (
        <div className="pt-2 animate-in fade-in duration-200">
          <input
            type="text"
            value={customHall}
            onChange={(e) => onCustomHallChange(e.target.value)}
            placeholder="Specify name of hall or hostel..."
            className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
