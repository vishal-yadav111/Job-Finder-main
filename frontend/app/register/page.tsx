"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Consuming our centralized safe API interface layer
import { registerUser } from "../lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Call library interface mapping cleanly
    const result = await registerUser({ email, password });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      // Safely consume extracted error string frames without breaking system runtime state logs
      setError(result.error || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-200">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-xl space-y-5 shadow-2xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Create Identity</h2>
          <p className="text-xs text-slate-400 mt-1">Deploy an isolated data tracking workspace</p>
        </div>

        {error && <div className="p-3 bg-rose-950/40 text-rose-400 border border-rose-900/60 text-xs rounded-lg">{error}</div>}
        {success && <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 text-xs rounded-lg">Account generated successfully! Routing...</div>}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" />
        </div>

        <button type="submit" disabled={loading || success} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-40">
          {loading ? "Registering System..." : "Register Container"}
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an operational token? <Link href="/login" className="text-emerald-400 hover:underline">Login here</Link>
        </p>
      </form>
    </div>
  );
}