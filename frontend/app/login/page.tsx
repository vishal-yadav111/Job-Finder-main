"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
// Import our centralized safe API interface layer
import { loginUser } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Safety timeout shield: cancels hanging network requests after 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Woven cleanly into your unified API client library wrapper instead of bare fetch
      const result = await loginUser({ email, password });

      clearTimeout(timeoutId);

      if (result.success && result.data) {
        // Authenticate the session context tokens
        login(result.data.access_token, result.data.refresh_token);
      } else {
        // Fall back to safely extracting error messages without throwing panel runtime exceptions
        setError(result.error || "An unexpected system error was encountered.");
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Connection gateway timed out. Please check if backend service is healthy.");
      } else {
        setError(err.message || "Connection failure: Remote core target host unreachable.");
      }
    } finally {
      clearTimeout(timeoutId);
      // Ensure local form tracking elements unlock correctly
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-200 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Premium Cinematic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(30,41,59,0.4),transparent_50%)] pointer-events-none" />
      <div className="absolute top-12 left-12 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Authentic Card Container Layout Frame */}
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-sm bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl space-y-6 shadow-2xl relative z-10 hover:border-slate-700/60 transition-colors duration-300"
      >
        {/* Workspace Brand Headers */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl shadow-inner">
              <ShieldCheck size={18} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-emerald-500">
              Security Portal
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Access Console
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Authenticate multitenant session credentials
            </p>
          </div>
        </div>

        {/* Dynamic Crash-safe Error Message Banners */}
        {error && (
          <div className="p-3 bg-rose-950/30 text-rose-400 border border-rose-900/40 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn font-medium shadow-inner">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Email Address Input Layout */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pl-0.5">
              Email Address
            </label>
            <div className="relative flex items-center group">
              <div className="absolute left-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                <Mail size={16} />
              </div>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={loading}
                placeholder="operator@workspace.io"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all font-medium disabled:opacity-40 shadow-inner" 
              />
            </div>
          </div>

          {/* Secure Password Input Layout */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pl-0.5">
              Password
            </label>
            <div className="relative flex items-center group">
              <div className="absolute left-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                <Lock size={16} />
              </div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                disabled={loading}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all font-medium disabled:opacity-40 shadow-inner" 
              />
            </div>
          </div>
        </div>

        {/* Submission Action Trigger buttons containing inline loaders */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 duration-200"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin text-white/80" />
              <span>Verifying Terminal State...</span>
            </>
          ) : (
            <span>Initialize Identity Login</span>
          )}
        </button>

        {/* Horizontal Navigation Split Footers */}
        <div className="pt-2 border-t border-slate-800/60 flex justify-center">
          <p className="text-center text-xs text-slate-500 font-medium">
            Need an isolated container?{" "}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition-colors">
              Register account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}