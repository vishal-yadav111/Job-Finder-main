"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { ErrorBoundary } from "../../components/ErrorBoundary";
import { EmptyState } from "../../components/ai-communication/EmptyState";
import { PromptSelector } from "../../components/ai-communication/PromptSelector";
import { ResponseCard } from "../../components/ai-communication/ResponseCard";
import { SkeletonLoader } from "../../components/ai-communication/SkeletonLoader";
import { useAICommunication } from "../hooks/useAICommunication";
import type { AppliedVia, GenerateCommunicationPayload, ResponseType, ToneType } from "../../types/aiCommunication";

const optionalAppliedVia = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["linkedin", "careers_page", "referral", "naukri", "indeed", "instahyre", "other"]).optional(),
) as z.ZodType<AppliedVia | undefined>;

const optionalResponseType = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum([
    "referral_request_email",
    "linkedin_connection_message",
    "linkedin_follow_up_message",
    "whatsapp_referral_request",
    "hr_outreach_message",
    "cold_email_to_recruiter",
    "tell_me_about_yourself",
    "why_do_you_want_to_join_our_company",
    "short_interview_introduction",
    "cover_letter",
    "follow_up_after_applying",
    "thank_you_message_after_interview",
    "networking_message",
    "referral_follow_up_message",
    "custom_response_type",
  ]).optional(),
) as z.ZodType<ResponseType | undefined>;

const optionalTone = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["professional", "friendly", "confident", "concise"]).optional(),
) as z.ZodType<"professional" | "friendly" | "confident" | "concise" | undefined>;

const schema = z.object({
  job_description: z.string().min(20, "Add a meaningful JD for better results"),
  company_name: z.string().optional(),
    job_link: z.string().optional(),
  job_role: z.string().optional(),
  applied_via: optionalAppliedVia,
  recruiter_name: z.string().optional(),
  hiring_manager_name: z.string().optional(),
  response_type: optionalResponseType,
  tone: optionalTone,
  custom_response_type: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FormInputValues = z.input<typeof schema>;

function buildPayload(values: FormValues): GenerateCommunicationPayload {
  return {
    company_name: values.company_name || undefined,
    job_role: values.job_role || undefined,
    job_description: values.job_description,
    applied_via: values.applied_via || undefined,
    recruiter_name: values.recruiter_name || undefined,
    hiring_manager_name: values.hiring_manager_name || undefined,
    response_type: values.response_type || undefined,
    tone: values.tone || undefined,
    custom_response_type: values.custom_response_type,
  };
}

export function AiCommunicationDashboard() {
  const {
    templates,
    analysis,
    responses,
    history,
    favorites,
    isLoading,
    isAnalyzing,
    error,
    generateOne,
    generateBundle,
    analyze,
    regenerate,
    toggleFavorite,
    saveResponse,
    getSmartBundle,
    clearResults,
  } = useAICommunication();

  const [activeTab, setActiveTab] = useState<ResponseType | "history" | "analysis">("history");
  const [toast, setToast] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const form = useForm<FormInputValues, undefined, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: "",
      job_link: "",
      job_description: "",
      job_role: "",
      applied_via: undefined,
      recruiter_name: "",
      hiring_manager_name: "",
      response_type: "linkedin_connection_message",
      tone: undefined,
      custom_response_type: "",
    },
  });

  const appliedVia = useWatch({ control: form.control, name: "applied_via" }) as AppliedVia | undefined;
  const responseType = (useWatch({ control: form.control, name: "response_type" }) as ResponseType | undefined) || "linkedin_connection_message";
  const tone = (useWatch({ control: form.control, name: "tone" }) as ToneType | undefined) || "professional";
  const jobDescription = useWatch({ control: form.control, name: "job_description" }) as string;
  const responseTypes = useMemo(() => templates?.templates ?? [], [templates]);
  const smartBundle = useMemo(() => getSmartBundle(appliedVia || "other"), [appliedVia, getSmartBundle]);
  const lastAnalyzedJobDescription = useRef<string>("");

  useEffect(() => {
    if (!jobDescription || jobDescription.trim().length < 20) return;
    if (lastAnalyzedJobDescription.current === jobDescription.trim()) return;

    const timer = window.setTimeout(async () => {
      try {
        const currentCompany = String(form.getValues("company_name") || "").trim();
        const currentRole = String(form.getValues("job_role") || "").trim();
        const currentLink = String(form.getValues("job_link") || "").trim();

        const analysisResult = await analyze(jobDescription, currentRole || undefined);
        lastAnalyzedJobDescription.current = jobDescription.trim();

        if (!currentCompany && analysisResult?.company_name) {
          form.setValue("company_name", analysisResult.company_name, { shouldDirty: false, shouldTouch: false });
        }

        if (!currentRole && analysisResult?.job_role) {
          form.setValue("job_role", analysisResult.job_role, { shouldDirty: false, shouldTouch: false });
        }

        if (!currentLink && analysisResult?.job_link) {
          form.setValue("job_link", analysisResult.job_link, { shouldDirty: false, shouldTouch: false });
        }
      } catch {
        // Ignore transient model failures; the user can still generate manually.
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [analyze, form, jobDescription]);

  const setTheme = (value: boolean) => {
    setDarkMode(value);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", value);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setToast("Copied to clipboard");
    window.setTimeout(() => setToast(null), 1600);
  };

  const handleGenerate = form.handleSubmit(async (values) => {
    const generated = await generateOne(buildPayload(values));
    setActiveTab(generated.response_type);
    setToast("Response generated");
    window.setTimeout(() => setToast(null), 1600);
  });

  const handleGenerateAll = form.handleSubmit(async (values) => {
    await generateBundle(buildPayload(values));
    setToast("All response formats generated");
    window.setTimeout(() => setToast(null), 1600);
  });

  const handleGenerateSmartBundle = form.handleSubmit(async (values) => {
    await generateBundle(buildPayload(values), smartBundle);
    setToast("Smart bundle generated");
    window.setTimeout(() => setToast(null), 1600);
  });

  const handleAnalyze = form.handleSubmit(async (values) => {
    await analyze(values.job_description, values.job_role);
    setActiveTab("analysis");
    setToast("JD analyzed");
    window.setTimeout(() => setToast(null), 1600);
  });

  const activeResponses = responses.length ? responses : history;

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] text-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" /> AI Communication Studio
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Generate recruiter-ready outreach, interview answers, and referral messages</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                The backend pulls your profile from environment variables, analyzes the JD, and generates tailored outputs without storing anything in Redis or the database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setTheme(!darkMode)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                {darkMode ? "Dark mode on" : "Light mode on"}
              </button>
              <button onClick={() => clearResults()} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                Clear outputs
              </button>
            </div>
          </div>

          {toast && (
            <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {toast}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <form className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Company name (optional)</span>
                    <input {...form.register("company_name")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Job role (optional)</span>
                    <input {...form.register("job_role")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Job link (optional)</span>
                    <input {...form.register("job_link")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" />
                  </label>
                </div>

                <label className="space-y-2 text-sm text-slate-200">
                  <span>Job description</span>
                  <textarea {...form.register("job_description")} rows={10} className="w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" placeholder="Paste the full JD here" />
                </label>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Applied via (optional)</span>
                    <select {...form.register("applied_via")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40">
                      <option value="">Auto-detect from JD</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="careers_page">Careers Page</option>
                      <option value="referral">Referral</option>
                      <option value="naukri">Naukri</option>
                      <option value="indeed">Indeed</option>
                      <option value="instahyre">Instahyre</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Recruiter name (optional)</span>
                    <input {...form.register("recruiter_name")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Hiring manager name (optional)</span>
                    <input {...form.register("hiring_manager_name")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Custom response type (optional)</span>
                    <input {...form.register("custom_response_type")} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none transition focus:border-emerald-400/40" placeholder="Optional custom prompt label" />
                  </label>
                </div>

                <PromptSelector
                  templates={responseTypes}
                  responseType={responseType}
                  tone={tone}
                  appliedVia={appliedVia || "other"}
                  onResponseTypeChange={(value) => form.setValue("response_type", value)}
                  onToneChange={(value) => form.setValue("tone", value)}
                />

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleAnalyze} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze JD
                  </button>
                  <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-300">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate
                  </button>
                  <button type="button" onClick={handleGenerateAll} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10">
                    Generate All
                  </button>
                  <button type="button" onClick={handleGenerateSmartBundle} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10">
                    Generate Smart Bundle
                  </button>
                </div>

                {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
              </form>
            </section>

            <section className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Outputs</h2>
                  <p className="text-sm text-slate-400">Use the generated content directly or refine it per channel.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveTab("history")} className={`rounded-full px-4 py-2 text-sm ${activeTab === "history" ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-200"}`}>Responses</button>
                <button onClick={() => setActiveTab("analysis")} className={`rounded-full px-4 py-2 text-sm ${activeTab === "analysis" ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-200"}`}>JD Analysis</button>
                {(responses.length > 0 ? responses : history).map((item) => (
                  <button key={item.response_type} onClick={() => setActiveTab(item.response_type)} className={`rounded-full px-4 py-2 text-sm capitalize ${activeTab === item.response_type ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-200"}`}>
                    {item.response_type.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {isLoading ? <SkeletonLoader /> : null}

              {!isLoading && !activeResponses.length && !analysis ? <EmptyState /> : null}

              {activeTab === "analysis" && analysis ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">JD Analysis</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">{analysis.skills.map((skill) => <span key={skill} className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{skill}</span>)}</div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Keywords</p>
                      <div className="mt-2 flex flex-wrap gap-2">{analysis.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-200">{keyword}</span>)}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-300">Experience level: <span className="text-white">{analysis.experience_level}</span></div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {analysis.suggested_improvements.map((item) => <li key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">{item}</li>)}
                  </ul>
                </div>
              ) : null}

              {activeTab !== "analysis" && activeResponses.length > 0 ? (
                <div className="space-y-4">
                  {activeResponses.map((response) => (
                    <ResponseCard
                      key={response.response_type}
                      response={response}
                      isFavorite={favorites.includes(response.response_type)}
                      onCopy={handleCopy}
                      onRegenerate={() => regenerate(buildPayload({ ...(form.getValues() as FormValues), response_type: response.response_type }))}
                      onFavorite={() => toggleFavorite(response.response_type)}
                      onSave={() => saveResponse(response, {
                        company_name: form.getValues().company_name,
                        job_role: form.getValues().job_role,
                        job_link: form.getValues().job_link,
                        job_description: form.getValues("job_description"),
                        recruiter_name: form.getValues().recruiter_name,
                        applied_via: form.getValues("applied_via") as AppliedVia | undefined,
                        platform_applied: form.getValues("applied_via") as AppliedVia | undefined,
                        message_badge: response.response_type,
                        status: "generated_applied",
                      })}
                    />
                  ))}
                </div>
              ) : null}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <details open>
                  <summary className="cursor-pointer text-sm font-medium text-white">Response history</summary>
                  <div className="mt-4 space-y-3">
                    {history.length ? history.map((item) => (
                      <div key={`${item.response_type}-${item.generated_content.slice(0, 12)}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                        <div className="font-medium text-white">{item.response_type.replace(/_/g, " ")}</div>
                        <p className="mt-2 line-clamp-3">{item.generated_content}</p>
                      </div>
                    )) : <p className="text-sm text-slate-400">No saved responses yet.</p>}
                  </div>
                </details>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-white">Favorite templates</summary>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    {favorites.length ? favorites.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 capitalize">{item.replace(/_/g, " ")}</div>) : <p>No favorites selected.</p>}
                  </div>
                </details>
              </div>
            </section>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
