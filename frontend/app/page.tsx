"use client";

import React from "react";
import { useJobs } from "./hooks/useJobs";
import { SearchBar } from "./components/SearchBar";
import { ScanButton } from "./components/ScanButton";
import { JobCard } from "./components/JobCard";
import { useAuth } from "./context/AuthContext";
import { LogOut, Loader2 } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { 
    jobs, 
    displaySearch, 
    setDisplaySearch, 
    isScanning, 
    toggleScan, 
    updateJobMutator,
    isLoading: isFeedLoading,
    isActionLoading 
  } = useJobs();

  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  return (
    <main className="p-6 md:p-12 max-w-7xl mx-auto w-full min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Modern Dashboard Typography Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Job Pipeline Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated crawler pipeline and referral processing center
          </p>
        </div>

        {/* Minimal Engine Status Signal Module connected to your backend states */}
        <div className="flex items-center gap-4 self-start md:self-auto">
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
              Engine State:
            </span>
            <div className="flex items-center gap-2">
              {isActionLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin text-slate-500" />
                  <span className="text-xs font-bold text-slate-500">SYNCING...</span>
                </>
              ) : (
                <>
                  <span className={`h-2.5 w-2.5 rounded-full relative ${isScanning ? "bg-emerald-500" : "bg-rose-500"}`}>
                    {isScanning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                  </span>
                  <span className={`text-xs font-bold tracking-wide ${isScanning ? "text-emerald-400" : "text-rose-400"}`}>
                    {isScanning ? "SCANNING..." : "STOPPED"}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 rounded-xl transition-all shadow"
            title="Terminate Secure Session"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Control Actions Ribbon Layer */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center justify-between">
        <ScanButton isScanning={isScanning} isActionLoading={isActionLoading} onToggle={toggleScan} />
        <SearchBar value={displaySearch} onChange={setDisplaySearch} />
      </div>

      {/* Main Table Content Container layout */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl max-h-[62vh]">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse block md:table">
            
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400 sticky top-0 z-10 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-4">Company & Position</th>
                <th scope="col" className="px-6 py-4">Target Link</th>
                <th scope="col" className="px-6 py-4">Referral Copy Block</th>
                <th scope="col" className="px-6 py-4">Current Status</th>
                <th scope="col" className="px-6 py-4 text-right">Expansion</th>
              </tr>
            </thead>

            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard 
                  key={job.job_hash} 
                  job={job} 
                  onUpdate={updateJobMutator} 
                />
              ))
            ) : (
              <tbody className="block md:table-row-group">
                <tr className="block md:table-row">
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 text-sm block md:table-cell font-medium">
                    {isFeedLoading ? "Querying secure Redis storage cache..." : "Pipeline feed empty. Toggle the scanner above to initialize streams."}
                  </td>
                </tr>
              </tbody>
            )}

          </table>
        </div>
      </div>
    </main>
  );
}