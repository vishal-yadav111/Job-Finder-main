"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Eye, Copy, Check, ExternalLink, Loader2, Building2, Briefcase, AlertCircle } from "lucide-react";
import { Job, JobStatus } from "../types/job";
import { LinkedinProfiles } from "./LinkedinProfile";
import { NotesEditor } from "./NotesEditor";

interface JobCardProps {
  job: Job;
  onUpdate: (hash: string, updates: { status?: JobStatus; notes?: string | null }) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<"link" | "msg" | null>(null);
  const [modalContent, setModalContent] = useState<{ title: string; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companyName = job.company?.trim() || "Unknown Company";
  const roleName = job.role?.trim() || "Unknown Role";

  const copyToClipboard = async (text: string, type: "link" | "msg") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(type);
      setError(null);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Clipboard Error:", err);
      setError("Failed to copy to clipboard.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    setIsSyncing(true);
    setError(null);
    try {
      await onUpdate(job.job_hash, { status: newStatus });
    } catch (err) {
      console.error("Status Update Error:", err);
      setError("Failed to update status.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const statusOptions = [
    { value: "no_action" as const, label: "No Action" },
    { value: "applied" as const, label: "Applied" },
    { value: "referral" as const, label: "Referral" },
    { value: "interview" as const, label: "Interview" },
    { value: "hr_round" as const, label: "HR Round" },
    { value: "selected" as const, label: "Selected" },
    { value: "rejected" as const, label: "Rejected" },
    { value: "closed" as const, label: "Closed" },
  ];

  return (
    <tbody className="block md:table-row-group border-b border-slate-800/60 bg-slate-900/10 md:bg-slate-900/40 hover:bg-slate-900/60 md:hover:bg-slate-900/80 transition-colors p-4 md:p-0">
      {error && (
        <tr className="bg-rose-950/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">
          <td colSpan={5} className="py-2 flex items-center justify-center gap-2">
            <AlertCircle size={12} /> {error}
          </td>
        </tr>
      )}
      <tr className="flex flex-col gap-3 md:gap-0 md:table-row">
        
        <td className="block md:table-cell px-2 md:px-6 py-1 md:py-4 text-sm font-medium text-slate-100 align-middle">
          <div className="flex items-start gap-2.5 md:block">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 md:hidden text-emerald-400 mt-0.5">
              <Building2 size={16} />
            </div>
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center rounded-full border border-emerald-900/70 bg-emerald-950/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 md:text-[9px]">
                Company
              </span>
              <span className="mt-1 text-base font-bold text-white capitalize md:text-sm md:font-semibold tracking-wide">
                {companyName}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 font-normal flex items-center gap-1 md:block">
                <Briefcase size={10} className="md:hidden text-slate-500" /> {roleName}
              </span>
            </div>
          </div>
        </td>

        <td className="block md:table-cell px-2 md:px-6 py-1 md:py-4 text-sm text-slate-300 align-middle">
          <div className="flex items-center justify-between md:justify-start gap-1.5 bg-slate-900/40 md:bg-transparent p-2 md:p-0 rounded-lg border border-slate-800/50 md:border-none">
            <span className="text-[11px] text-slate-400 md:hidden font-bold uppercase tracking-wider pl-1">Target Link:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard(job.job_link, "link")}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-all shadow-sm"
              >
                {copiedField === "link" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setModalContent({ title: "Destination Job Link URL", text: job.job_link })}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Eye size={14} />
              </button>
              <a
                href={job.job_link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-slate-800/60 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-800 rounded-md text-slate-400 hover:text-emerald-400 transition-all shadow-sm"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </td>

        <td className="block md:table-cell px-2 md:px-6 py-1 md:py-4 text-sm text-slate-300 align-middle">
          <div className="flex items-center justify-between md:justify-start gap-1.5 bg-slate-900/40 md:bg-transparent p-2 md:p-0 rounded-lg border border-slate-800/50 md:border-none">
            <span className="text-[11px] text-slate-400 md:hidden font-bold uppercase tracking-wider pl-1">Referral Block:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard(job.referral_message, "msg")}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-all shadow-sm"
              >
                {copiedField === "msg" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setModalContent({ title: "Generated AI Communication Layout", text: job.referral_message })}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
        </td>

        <td className="block md:table-cell px-2 md:px-6 py-1 md:py-4 text-sm align-middle">
          <div className="flex items-center justify-between md:justify-start gap-1.5 bg-slate-900/40 md:bg-transparent p-2 md:p-0 rounded-lg border border-slate-800/50 md:border-none">
            <span className="text-[11px] text-slate-400 md:hidden font-bold uppercase tracking-wider pl-1">Status State:</span>
            <div className="relative flex items-center">
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                className="pl-2.5 pr-7 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner font-medium cursor-pointer appearance-none min-w-[120px]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 text-slate-400">
                {isSyncing ? (
                  <Loader2 size={10} className="animate-spin text-sky-400" />
                ) : (
                  <ChevronDown size={12} />
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="block md:table-cell px-2 md:px-6 py-1 md:py-4 text-sm text-right align-middle">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full md:w-auto md:inline-flex gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-all font-semibold shadow-sm"
          >
            <span>{isExpanded ? "Hide Assets" : "View Assets"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="flex flex-col md:table-row bg-slate-950/40 border-t border-slate-800/60 mt-2 md:mt-0">
          <td colSpan={5} className="px-2 md:px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  LinkedIn Target Connection Points
                </label>
                <LinkedinProfiles profiles={job.linkedin_profiles} referralMessage={job.referral_message} />
              </div>

              <div className="lg:col-span-5">
                <NotesEditor
                  jobHash={job.job_hash}
                  initialNotes={job.notes}
                  onSave={onUpdate}
                />
              </div>

              <div className="lg:col-span-3 space-y-1.5 text-xs text-slate-400 border-l border-slate-800/80 pl-4 lg:pl-6 pt-2 lg:pt-0">
                <div className="text-[10px] font-mono tracking-tight opacity-40 select-all truncate bg-slate-950 p-1 rounded border border-slate-800/50 mb-1 max-w-[240px] md:max-w-none">
                  HASH: {job.job_hash}
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Origin Target: </span>
                  <span className="capitalize">{companyName} Feed</span>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}

      {modalContent && (
        <tr className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <td className="block border-none p-0 w-full max-w-2xl">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-t-xl">
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase truncate pr-4">
                  {modalContent.title}
                </h3>
                <button
                  onClick={() => copyToClipboard(modalContent.text, "link")}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-all shadow shrink-0"
                >
                  <Copy size={12} />
                  <span>Copy Content</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed bg-slate-950/20 max-h-96 custom-scrollbar">
                {job.referral_message}
              </div>

              <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-950/40 rounded-b-xl">
                <button
                  onClick={() => setModalContent(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};