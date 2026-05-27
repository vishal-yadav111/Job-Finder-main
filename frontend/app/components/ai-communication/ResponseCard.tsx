"use client";

import { Copy, Download, Heart, RotateCcw, Star } from "lucide-react";
import type { ResponseItem } from "../../types/aiCommunication";

interface ResponseCardProps {
  response: ResponseItem;
  isFavorite: boolean;
  onCopy: (value: string) => void;
  onRegenerate: () => void;
  onFavorite: () => void;
  onSave: () => void;
}

export function ResponseCard({ response, isFavorite, onCopy, onRegenerate, onFavorite, onSave }: ResponseCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{response.response_type.replace(/_/g, " ")}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{response.applied_via} • {response.tone}</h3>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          Confidence {(response.confidence_score * 100).toFixed(0)}%
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-100 whitespace-pre-wrap">
        {response.generated_content}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {response.detected_skills.map((skill) => (
          <span key={skill} className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-200">{skill}</span>
        ))}
        {response.matched_user_skills.map((skill) => (
          <span key={skill} className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{skill}</span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => onCopy(response.generated_content)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <button onClick={onRegenerate} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
          <RotateCcw className="h-3.5 w-3.5" /> Regenerate
        </button>
        <button onClick={onSave} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
          <Download className="h-3.5 w-3.5" /> Save
        </button>
        <button onClick={onFavorite} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
          {isFavorite ? <Heart className="h-3.5 w-3.5 fill-current text-rose-300" /> : <Star className="h-3.5 w-3.5" />} Favorite
        </button>
      </div>
    </div>
  );
}
