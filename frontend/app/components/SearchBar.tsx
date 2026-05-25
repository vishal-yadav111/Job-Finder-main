"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  
  // FIXED: Removed the unnecessary check, now directly invokes the function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  // Robustness check: Ensure value is always a string to prevent controlled input crashes
  const safeValue = value ?? "";

  return (
    <div className="relative w-full max-w-xl group">
      {/* Decorative Outer Glow Effect on Focus */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />

      <div className="relative flex items-center">
        {/* Left Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors duration-300 group-focus-within:text-emerald-400 text-slate-500">
          <Search size={18} strokeWidth={2.5} />
        </div>

        {/* The Search Input */}
        <input
          type="text"
          value={safeValue}
          onChange={handleInputChange}
          placeholder="Search jobs by company, role, keywords, status..."
          className="w-full pl-11 pr-10 py-2.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 text-sm shadow-2xl group-hover:border-slate-600/50"
        />

        {/* Instant Clear Button */}
        {safeValue.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors duration-200"
            title="Clear search"
          >
            <X size={16} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Subtle bottom indicator line */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
    </div>
  );
};