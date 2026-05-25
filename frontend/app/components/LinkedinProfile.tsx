"use client";

import React, { useState } from "react";
import { UserRoundSearch, Check, Copy, AlertCircle, ExternalLink } from "lucide-react";
import { LinkedinProfile } from "../types/job";

interface LinkedinProfilesProps {
  profiles: LinkedinProfile[];
  referralMessage: string;
}

export const LinkedinProfiles: React.FC<LinkedinProfilesProps> = ({ profiles, referralMessage }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  const handleProfileClick = async (url: string, index: number) => {
    // 1. Safe Clipboard Action
    try {
      if (referralMessage) {
        await navigator.clipboard.writeText(referralMessage);
        setCopiedIndex(index);
        setErrorIndex(null);
        setTimeout(() => setCopiedIndex(null), 2500);
      }
    } catch (err) {
      console.error("Clipboard access denied:", err);
      setErrorIndex(index);
      setTimeout(() => setErrorIndex(null), 2000);
    }

    // 2. Safe Navigation Action
    if (url) {
      try {
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Navigation failed:", err);
      }
    }
  };

  // Error Handling: Graceful empty state
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
        <span className="text-[10px] text-slate-500 italic uppercase tracking-wider">No associated targets</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-full">
      {profiles.map((profile, idx) => {
        const url = profile.linkedin_url || "#";
        const isCopied = copiedIndex === idx;
        const isError = errorIndex === idx;

        return (
          <button
            key={`${idx}-${profile.name}`}
            onClick={() => handleProfileClick(url, idx)}
            className={`flex items-center justify-between p-3 text-xs rounded-xl border transition-all duration-200 text-left w-full group shadow-sm ${
              isCopied
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-800/50"
                : isError
                ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
            title="Click to copy template and open profile"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className={`p-1.5 rounded-lg border ${isCopied ? "bg-emerald-900/30 border-emerald-800" : "bg-slate-950 border-slate-800"}`}>
                <UserRoundSearch size={14} className={isCopied ? "text-emerald-400" : "text-sky-500"} />
              </div>
              <div className="truncate">
                <p className="font-semibold truncate text-slate-200 group-hover:text-white transition-colors">
                  {profile.name || "Unknown Associate"}
                </p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono uppercase tracking-tight opacity-70">
                  {profile.linkedin_url ? "View Profile" : "No URL Provided"}
                </p>
              </div>
            </div>
            
            <div className="shrink-0 transition-all duration-200">
              {isCopied ? (
                <Check size={14} className="text-emerald-400" />
              ) : isError ? (
                <AlertCircle size={14} className="text-rose-400" />
              ) : (
                <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};