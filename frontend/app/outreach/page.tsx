"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../lib/api";

const STATUSES = [
  "generated_applied",
  "referral_asked",
  "referred",
  "call_comes",
  "interviewed",
  "result",
] as const;

const STATUS_META: Record<string, { label: string; accent: string; panel: string; chip: string; border: string }> = {
  generated_applied: {
    label: "Generated Applied",
    accent: "from-cyan-500/20 via-sky-500/10 to-slate-900",
    panel: "bg-cyan-500/5",
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    border: "border-cyan-500/20",
  },
  referral_asked: {
    label: "Referral Asked",
    accent: "from-amber-500/20 via-orange-500/10 to-slate-900",
    panel: "bg-amber-500/5",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    border: "border-amber-500/20",
  },
  referred: {
    label: "Referred",
    accent: "from-emerald-500/20 via-green-500/10 to-slate-900",
    panel: "bg-emerald-500/5",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/20",
  },
  call_comes: {
    label: "Call Comes",
    accent: "from-fuchsia-500/20 via-violet-500/10 to-slate-900",
    panel: "bg-fuchsia-500/5",
    chip: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    border: "border-fuchsia-500/20",
  },
  interviewed: {
    label: "Interviewed",
    accent: "from-sky-500/20 via-blue-500/10 to-slate-900",
    panel: "bg-sky-500/5",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    border: "border-sky-500/20",
  },
  result: {
    label: "Result",
    accent: "from-rose-500/20 via-red-500/10 to-slate-900",
    panel: "bg-rose-500/5",
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    border: "border-rose-500/20",
  },
};

export default function OutreachPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { authenticatedFetch, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const form = useForm({
    defaultValues: {
      company: "",
      role: "",
      job_link: "",
      recruiter_name: "",
      platform_applied: "",
      notes: "",
      status: "generated_applied",
    },
  });

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    STATUSES.forEach((s) => (map[s] = []));
    items.forEach((it) => {
      const st = it.status || "generated_applied";
      if (!map[st]) map[st] = [];
      map[st].push(it);
    });
    return map;
  }, [items]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    load();
  }, [isAuthLoading, isAuthenticated]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE}/jobs`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(jobHash: string, nextStatus: string) {
    const previous = items;
    setItems((current) => current.map((item) => (item.job_hash === jobHash ? { ...item, status: nextStatus } : item)));

    try {
      const response = await authenticatedFetch(`${API_BASE}/jobs/${jobHash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
    } catch (err: any) {
      setItems(previous);
      setError(err?.message || "Failed to update status");
    }
  }

  async function handleDelete(jobHash: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.job_hash !== jobHash));

    try {
      const response = await authenticatedFetch(`${API_BASE}/jobs/${jobHash}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
    } catch (err: any) {
      setItems(previous);
      setError(err?.message || "Failed to delete entry");
    }
  }

  function requestDelete(item: any) {
    setDeleteTarget(item);
  }

  async function onCreate(values: any) {
    if (!values.company || !values.role) {
      alert("Company and role are required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        company: values.company,
        role: values.role,
        job_link: values.job_link,
        recruiter_name: values.recruiter_name,
        platform_applied: values.platform_applied,
        notes: values.notes,
        status: values.status,
      };

      const response = await authenticatedFetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}`);
      }

      form.reset();
      setIsCreateOpen(false);
      load();
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,1))] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-2">Applications Console</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Outreach / Applications</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">Track applications across stages, move entries between accordions, and keep each status block visually distinct.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
          >
            + Create Company
          </button>
        </div>

        {loading ? <div>Loading...</div> : null}
        {error ? <div className="text-rose-400">{error}</div> : null}

        <section className="space-y-4">
          {STATUSES.map((status) => (
            <details key={status} className={`group overflow-hidden rounded-3xl border ${STATUS_META[status].border} ${STATUS_META[status].panel} backdrop-blur-sm`} open>
              <summary className={`cursor-pointer list-none px-5 py-4 bg-gradient-to-r ${STATUS_META[status].accent} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] font-bold ${STATUS_META[status].chip}`}>
                    {STATUS_META[status].label}
                  </span>
                  <span className="text-sm text-slate-300">{grouped[status]?.length || 0} items</span>
                </div>
                <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <div className="p-4 md:p-5 border-t border-white/5">
                {grouped[status] && grouped[status].length ? (
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead className="text-slate-400 text-xs uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-3 py-2">Company</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Recruiter</th>
                        <th className="px-3 py-2">Link</th>
                        <th className="px-3 py-2">Message</th>
                        <th className="px-3 py-2">Notes</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[status].map((it: any) => (
                        <tr key={it.job_hash} className="rounded-2xl bg-slate-950/60 ring-1 ring-white/5 shadow-sm">
                          <td className="px-3 py-4 font-semibold align-top">{it.company}</td>
                          <td className="px-3 py-4 text-slate-300 align-top">{it.role}</td>
                          <td className="px-3 py-4 text-slate-400 align-top">{it.recruiter_name || "-"}</td>
                          <td className="px-3 py-4 align-top"><a href={it.job_link} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4">Open</a></td>
                          <td className="px-3 py-4 text-sm text-slate-300 align-top max-w-[320px]">
                            <div className="line-clamp-2">{it.referral_message || "-"}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-400 align-top max-w-[240px]">
                            <div className="line-clamp-2 whitespace-pre-line">{it.notes || "-"}</div>
                          </td>
                          <td className="px-3 py-4 align-top">
                            <select
                              value={it.status || status}
                              onChange={(e) => handleStatusChange(it.job_hash, e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                              {STATUSES.map((option) => (
                                <option key={option} value={option}>{STATUS_META[option].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4 align-top text-right">
                            <button
                              type="button"
                              onClick={() => requestDelete(it)}
                              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-400 px-2 py-4">No entries</div>
                )}
              </div>
            </details>
          ))}
        </section>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-cyan-950/30">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-transparent px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Create record</p>
                <h2 className="mt-1 text-2xl font-bold">Create Company</h2>
                <p className="mt-1 text-sm text-slate-400">Add a new application or referral entry with a polished, focused form.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">
                Close
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onCreate)} className="grid gap-4 px-6 py-6 md:grid-cols-2">
              <input {...form.register("company")} placeholder="Company (required)" className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40 md:col-span-1" />
              <input {...form.register("role")} placeholder="Role (required)" className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40 md:col-span-1" />
              <input {...form.register("job_link")} placeholder="Job link" className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40 md:col-span-2" />
              <input {...form.register("recruiter_name")} placeholder="Recruiter name" className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40" />
              <input {...form.register("platform_applied")} placeholder="Platform applied" className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40" />
              <select {...form.register("status")} className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40 md:col-span-2">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <textarea {...form.register("notes")} placeholder="Notes" rows={5} className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40 md:col-span-2" />
              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-2xl bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-2xl shadow-rose-950/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-rose-500/20 via-orange-500/10 to-transparent">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300/80">Delete validation</p>
              <h3 className="mt-1 text-xl font-bold">Remove this company?</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-300">
                This will permanently delete <span className="font-semibold text-white">{deleteTarget.company}</span> for <span className="font-semibold text-white">{deleteTarget.role}</span>.
              </p>
              <p className="text-xs text-slate-500">This action removes the row from the table and backend storage.</p>
            </div>
            <div className="px-6 py-5 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  if (target?.job_hash) {
                    await handleDelete(target.job_hash);
                  }
                }}
                className="rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-rose-500/20"
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
