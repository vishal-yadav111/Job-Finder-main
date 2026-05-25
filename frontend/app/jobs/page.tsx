"use client";

import React, { useState } from "react";
import { useJobs } from "../hooks/useJobs";
import { SearchBar } from "../components/SearchBar";
import { ScanButton } from "../components/ScanButton";
import { JobCard } from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { LogOut, Loader2, Database, AlertCircle, RefreshCw } from "lucide-react";

export default function JobsDashboardPage() {
  const { isAuthenticated } = useAuth();
  const {
    jobs,
    displaySearch,
    setDisplaySearch,
    isScanning,
    toggleScan,
    isLoading,
    isActionLoading,
    updateJobMutator,
  } = useJobs();

  const { logout } = useAuth();

  // Local state to handle safe runtime recovery without bricking UI trees
  const [hasRenderError, setHasRenderError] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Premium Ambient Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.2),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <header className="bg-slate-950/60 backdrop-blur-md border-b border-slate-900 px-6 py-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 mt-1 hidden sm:block shadow-inner">
              <Database size={20} className={isScanning ? "animate-pulse text-emerald-400" : "text-slate-500"} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Job Pipeline Console
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Automated crawler pipeline and referral processing center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800/80 shadow-inner">
              <span className="text-[10px] font-mono tracking-widest uppercase font-black text-slate-500">
                Engine State
              </span>
              <div className="flex items-center gap-2">
                {isActionLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-sky-400" />
                    <span className="text-xs font-bold font-mono tracking-wide text-sky-400">SYNCING...</span>
                  </>
                ) : (
                  <>
                    <span className={`h-2 w-2 rounded-full relative ${isScanning ? "bg-emerald-500" : "bg-rose-500"}`}>
                      {isScanning && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                    </span>
                    <span className={`text-xs font-bold font-mono tracking-wide ${isScanning ? "text-emerald-400" : "text-rose-400"}`}>
                      {isScanning ? "SCANNING" : "STOPPED"}
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 rounded-xl transition-all shadow-md duration-200 group active:scale-95"
              title="Terminate Secure Session"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col overflow-hidden relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center justify-between">
          <ScanButton isScanning={isScanning} isActionLoading={isActionLoading} onToggle={toggleScan} />
          <SearchBar value={displaySearch} onChange={setDisplaySearch} />
        </div>

        {/* Outer UI Grid Layout Panel frame with structural overflow handlers */}
        <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[66vh] hover:border-slate-800 transition-colors duration-300">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse block md:table">
              <thead className="bg-slate-950/90 border-b border-slate-800/80 uppercase tracking-wider text-[10px] font-bold text-slate-400 sticky top-0 z-10 hidden md:table-header-group backdrop-blur-md">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-widest pl-6">Company & Position</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-widest">Target Link</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-widest">Referral Copy Block</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-widest">Current Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-widest text-right pr-6">Expansion</th>
                </tr>
              </thead>

              {/* Crash-safe Data Mutation Validation Gateways */}
              {hasRenderError ? (
                <tbody className="block md:table-row-group">
                  <tr className="block md:table-row">
                    <td colSpan={5} className="px-6 py-16 text-center block md:table-cell">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                        <AlertCircle className="text-rose-500 animate-bounce" size={28} />
                        <span className="text-sm font-semibold text-slate-200">Data Array Processing Exception Encountered</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          An incoming payload contained missing attributes or unstructured keys.
                        </p>
                        <button 
                          onClick={() => setHasRenderError(false)}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all"
                        >
                          <RefreshCw size={12} /> Clear View Cache
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : Array.isArray(jobs) && jobs.length > 0 ? (
                // Safe iterator mapping block that isolates individual component array faults
                (() => {
                  try {
                    return (
                      <>
                        {jobs.map((job) => {
                          if (!job || typeof job !== "object" || !job.job_hash) {
                            throw new Error("Malformed data item object detected inside array mapping loop.");
                          }
                          return (
                            <JobCard key={job.job_hash} job={job} onUpdate={updateJobMutator} />
                          );
                        })}
                      </>
                    );
                  } catch (err) {
                    // Safe error capture state boundary trigger without destroying parent dashboard state
                    setTimeout(() => setHasRenderError(true), 0);
                    return null;
                  }
                })()
              ) : (
                <tbody className="block md:table-row-group">
                  <tr className="block md:table-row">
                    <td colSpan={5} className="px-6 py-24 text-center text-slate-400 block md:table-cell font-medium text-sm bg-slate-950/20">
                      <div className="flex flex-col items-center justify-center gap-3">
                        {isLoading ? (
                          <>
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                            <span className="text-xs font-mono tracking-wider uppercase text-slate-500">Querying secure Redis storage cache...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50 text-slate-600 shadow-inner mb-1">
                              <Database size={18} />
                            </div>
                            <span className="text-slate-400 font-semibold">No Operational Jobs Listed</span>
                            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                              Pipeline feed empty. Toggle the scanner module switch above to initialize background event scraping streams.
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}