"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, AlertTriangle, PenLine } from "lucide-react";

interface NotesEditorProps {
  jobHash: string;
  initialNotes: string | null;
  onSave: (hash: string, updates: { notes: string }) => void;
}

export const NotesEditor = ({ jobHash, initialNotes, onSave }: NotesEditorProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [syncState, setSyncState] = useState<"idle" | "typing" | "saving" | "saved" | "error">("idle");
  
  const currentHashRef = useRef(jobHash);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentHashRef.current !== jobHash) {
      currentHashRef.current = jobHash;
      setNotes(initialNotes || "");
      setSyncState("idle");
    }
  }, [jobHash, initialNotes]);

  const handleTextChange = (value: string) => {
    setNotes(value);
    setSyncState("typing");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setSyncState("saving");
      try {
        await onSave(jobHash, { notes: value });
        setSyncState("saved");
        setTimeout(() => setSyncState("idle"), 1500);
      } catch (err) {
        console.error("Save failed:", err);
        setSyncState("error"); // UI state for error handling
      }
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-3 w-full group">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within:text-emerald-400 transition-colors">
          <PenLine size={12} />
          Personal Notes & Log entries
        </label>
        
        <div className="text-[10px] font-semibold tracking-wide flex items-center gap-1.5 min-h-[16px]">
          {syncState === "typing" && <span className="text-amber-500 animate-pulse">Typing...</span>}
          {syncState === "saving" && <span className="text-sky-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
          {syncState === "saved" && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Saved</span>}
          {syncState === "error" && <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={10} /> Sync Failed</span>}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Add follow-up notes, application timeline markers, or details..."
          rows={3}
          className={`w-full p-3 bg-slate-950 border rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none transition-all duration-300 resize-none custom-scrollbar shadow-inner ${
            syncState === "error" 
              ? "border-rose-900/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" 
              : "border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          }`}
        />
        {/* Subtle decorative bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg transition-colors duration-500 ${
          syncState === "saving" ? "bg-sky-500" : syncState === "saved" ? "bg-emerald-500" : syncState === "error" ? "bg-rose-500" : "bg-transparent"
        }`} />
      </div>
    </div>
  );
};