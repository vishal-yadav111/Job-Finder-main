"use client";

import React from "react";
import { Loader2, Power, StopCircle, PlayCircle } from "lucide-react";

interface ScanButtonProps {
  isScanning: boolean;
  isActionLoading: boolean;
  onToggle: () => void;
}

export const ScanButton: React.FC<ScanButtonProps> = ({ 
  isScanning, 
  isActionLoading, 
  onToggle 
}) => {
  
  // Defensive Guard: Ensure onToggle is only called if defined to prevent runtime crashes
  const handleToggle = () => {
    if (typeof onToggle === "function") {
      onToggle();
    } else {
      console.error("Critical: ScanButton 'onToggle' prop is missing.");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isActionLoading}
      className={`
        relative overflow-hidden px-6 py-2.5 rounded-xl font-bold tracking-widest text-xs uppercase border transition-all duration-300 
        shadow-lg flex items-center justify-center gap-2.5 min-w-[140px] select-none
        ${isActionLoading
          ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed shadow-none"
          : isScanning
          ? "bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border-rose-800/80 hover:shadow-rose-900/20 active:scale-[0.98]"
          : "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800/80 hover:shadow-emerald-900/20 active:scale-[0.98]"
        }
      `}
    >
      {isActionLoading ? (
        <>
          <Loader2 size={14} className="animate-spin text-slate-400" />
          <span>Syncing...</span>
        </>
      ) : isScanning ? (
        <>
          <StopCircle size={14} />
          <span>Stop Scan</span>
        </>
      ) : (
        <>
          <PlayCircle size={14} />
          <span>Start Scan</span>
        </>
      )}

      {/* Subtle Shine/Reflect Overlay for active state */}
      {!isActionLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] hover:animate-shine transition-transform" />
      )}
    </button>
  );
};