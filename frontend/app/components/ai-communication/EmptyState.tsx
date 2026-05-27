"use client";

import { Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">No responses yet</h3>
          <p className="mt-2 text-sm text-slate-300">
            Fill the form, analyze the JD, and generate a smart bundle of tailored outreach messages.
          </p>
        </div>
      </div>
    </div>
  );
}
