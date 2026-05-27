"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeJD, fetchTemplates, generateAllCommunication, generateCommunication } from "../../lib/aiCommunicationApi";
import { createReferral } from "../../lib/api";
import type {
  AnalyzeJDResult,
  AppliedVia,
  GenerateCommunicationPayload,
  ResponseItem,
  ResponseType,
  TemplatesResult,
} from "../../types/aiCommunication";

const HISTORY_KEY = "ai-communication-history";
const FAVORITES_KEY = "ai-communication-favorites";

export function extractFirstUrl(text?: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/https?:\/\/[^\s)\]]+/i);
  return match?.[0]?.replace(/[.,;]+$/, "");
}

function normalizeCandidate(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^["'“”‘’(<\[]+|["'“”‘’)>\].,;:!]+$/g, "").trim();
}

function titleCaseSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function looksLikeCompanyName(value: string): boolean {
  const candidate = normalizeCandidate(value);
  if (candidate.length < 2 || candidate.length > 80) return false;
  if (!/[A-Za-z]/.test(candidate)) return false;

  const rejectedTerms = /(software|engineer|developer|manager|architect|analyst|intern|associate|specialist|lead|principal|senior|junior|remote|hybrid|full[- ]time|part[- ]time|contract|salary|compensation|responsibilities|requirements|overview|description|position|role|job|apply|team|department|company|organization|employer|about|hiring)/i;
  return !rejectedTerms.test(candidate);
}

function deriveCompanyFromUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const genericDomains = new Set(["com", "co", "io", "net", "org", "in", "jobs", "careers", "hire", "app"]);
    const hostParts = host.split(".").filter(Boolean);
    const subdomain = hostParts.length > 2 ? hostParts[0] : "";
    const hostBase = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : "";

    if (host.includes("lever.co") || host.includes("greenhouse.io") || host.includes("ashbyhq.com") || host.includes("workday.com")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean).map((segment) => segment.trim()).filter(Boolean);
      const candidate = pathParts.find((segment) => !genericDomains.has(segment.toLowerCase()) && !/^(jobs?|job-boards?|apply|careers?)$/i.test(segment));
      if (candidate && looksLikeCompanyName(candidate)) {
        return titleCaseSlug(candidate);
      }
    }

    if (subdomain && !genericDomains.has(subdomain.toLowerCase()) && looksLikeCompanyName(subdomain)) {
      return titleCaseSlug(subdomain);
    }

    if (hostBase && !genericDomains.has(hostBase.toLowerCase()) && looksLikeCompanyName(hostBase)) {
      return titleCaseSlug(hostBase);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildLines(jobDescription: string): string[] {
  return jobDescription
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => normalizeCandidate(line))
    .filter(Boolean);
}

function isSectionLine(line: string, sectionName: string): boolean {
  return new RegExp(`^${sectionName}$`, "i").test(line.trim());
}

function stripDecorativePrefix(line: string): string {
  return normalizeCandidate(
    line
      .replace(/^avatar for\s+/i, "")
      .replace(/\s+company logo$/i, "")
      .replace(/^company logo\s*/i, "")
      .replace(/^logo\s*/i, "")
  );
}

export function extractCompanyName(jobDescription?: string): string | undefined {
  if (!jobDescription) return undefined;

  const lines = buildLines(jobDescription);
  const linePatterns = [
    /^(?:company name|company|organization|employer|hiring company|company profile)\s*[:\-]\s*(.+)$/i,
    /^(?:about|join|work at|at)\s+(.+?)(?:[.,;:!\-]|$)/i,
    /^(.+?)\s+(?:is|are)\s+(?:hiring|looking for|seeking)\b/i,
    /^(?:we at|our team at)\s+(.+?)(?:[.,;:!\-]|$)/i,
  ];

  const aboutCompanyIndex = lines.findIndex((line) => isSectionLine(line, "About the company"));
  if (aboutCompanyIndex >= 0) {
    const sectionLines = lines.slice(aboutCompanyIndex + 1, aboutCompanyIndex + 8);
    for (const line of sectionLines) {
      const cleanedLine = stripDecorativePrefix(line);
      if (!cleanedLine || /^(actively hiring|growing fast|company location|company size|company industries|employees?|save|share)$/i.test(cleanedLine)) {
        continue;
      }

      for (const pattern of linePatterns) {
        const candidate = normalizeCandidate(cleanedLine.match(pattern)?.[1] || "");
        if (candidate && looksLikeCompanyName(candidate)) {
          return candidate;
        }
      }

      if (looksLikeCompanyName(cleanedLine)) {
        return cleanedLine;
      }
    }
  }

  for (const line of lines) {
    for (const pattern of linePatterns) {
      const candidate = normalizeCandidate(line.match(pattern)?.[1] || "");
      if (candidate && looksLikeCompanyName(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

export function extractJobRole(jobDescription?: string): string | undefined {
  if (!jobDescription) return undefined;

  const lines = buildLines(jobDescription);
  const headerEndIndex = lines.findIndex((line) => isSectionLine(line, "About the job"));
  const headerLines = headerEndIndex >= 0 ? lines.slice(0, headerEndIndex) : lines.slice(0, 12);
  const patterns = [
    /(?:job title|job role|role|position|title)\s*[:\-]\s*([A-Za-z0-9&.,()\-/\s]{2,80})/i,
    /(?:we are hiring for|hiring for|looking for|seeking)\s+(?:an?\s+)?([A-Za-z0-9&.,()\-/\s]{2,80}?)(?=\s+(?:role|position|opening|opportunity|at|in|for|to)\b|[.,;\n]|$)/i,
    /(?:for the|for an?|as an?|as a)\s+([A-Za-z0-9&.,()\-/\s]{2,80}?)\s+(?:role|position|opening|opportunity)\b/i,
  ];

  for (const line of headerLines) {
    const cleanedLine = stripDecorativePrefix(line);
    if (!cleanedLine || /^(avatar|share|save|actively hiring|growing fast|\$|₹|posted:|job location|remote work policy|visa sponsorship|relocation|skills|about the company)$/i.test(cleanedLine)) {
      continue;
    }

    for (const pattern of patterns) {
      const match = cleanedLine.match(pattern);
      const candidate = normalizeCandidate(match?.[1] || "");
      if (candidate) {
        return candidate;
      }
    }

    if (/(developer|engineer|scientist|manager|architect|analyst|consultant|specialist|lead|designer|administrator|tester|intern|associate|officer|executive|developer|full stack|front end|backend|backend|mern|react|node)/i.test(cleanedLine) && cleanedLine.length <= 80) {
      return cleanedLine;
    }
  }

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) {
      return candidate.replace(/\s+/g, " ");
    }
  }

  return undefined;
}

type SaveResponseMeta = {
  company_name?: string;
  job_role?: string;
  job_description?: string;
  job_link?: string;
  recruiter_name?: string;
  linkedin_profiles?: unknown[];
  status?: string;
  platform_applied?: string;
  applied_via?: string;
  message_badge?: string;
  notes?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function buildResolvedMetadata(meta?: SaveResponseMeta) {
  const jobDescription = String(meta?.job_description || "").trim();
  const explicitCompany = String(meta?.company_name || "").trim();
  const explicitRole = String(meta?.job_role || "").trim();
  const explicitLink = String(meta?.job_link || "").trim();

  const extractedCompany = extractCompanyName(jobDescription);
  const extractedRole = extractJobRole(jobDescription);
  const extractedLink = extractFirstUrl(jobDescription);
  const linkedCompany = deriveCompanyFromUrl(explicitLink || extractedLink);

  const companyName = explicitCompany || extractedCompany || linkedCompany || "Unknown Company";
  const jobRole = explicitRole || extractedRole || "Software Developer";
  const jobLink = explicitLink || extractedLink || undefined;

  return { companyName, jobRole, jobLink };
}

export function getSmartBundle(appliedVia: AppliedVia, templates: TemplatesResult | null): ResponseType[] {
  if (templates?.smart_bundles?.[appliedVia]) {
    return templates.smart_bundles[appliedVia];
  }

  if (appliedVia === "linkedin") {
    return ["linkedin_connection_message", "linkedin_follow_up_message", "networking_message"];
  }

  if (appliedVia === "careers_page") {
    return ["hr_outreach_message", "follow_up_after_applying", "cover_letter"];
  }

  if (appliedVia === "referral") {
    return ["referral_request_email", "referral_follow_up_message", "whatsapp_referral_request"];
  }

  return ["cover_letter", "cold_email_to_recruiter", "networking_message"];
}

export function useAICommunication() {
  const [templates, setTemplates] = useState<TemplatesResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeJDResult | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [history, setHistory] = useState<ResponseItem[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates().then((result) => {
      if (result.success) {
        setTemplates(result.data);
      }
    }).catch(() => undefined);

  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Intentionally silent: the module must remain stateless on the backend.
    }
  }, [favorites, history]);

  const saveToHistory = useCallback((item: ResponseItem) => {
    setHistory((prev) => [item, ...prev.filter((entry) => entry.response_type !== item.response_type)].slice(0, 20));
  }, []);

  const saveResponse = useCallback(async (item: ResponseItem, meta?: SaveResponseMeta) => {
    saveToHistory(item);

    // Attempt to persist the generated response to the backend as a referral/application record
    try {
      const payload = {
        company: meta?.company_name?.trim() || "",
        role: meta?.job_role?.trim() || "",
        job_link: meta?.job_link?.trim() || undefined,
        recruiter_name: meta?.recruiter_name || undefined,
        linkedin_profiles: meta?.linkedin_profiles || [],
        referral_message: item.generated_content,
        status: meta?.status || "generated_applied",
        platform_applied: meta?.platform_applied || meta?.applied_via || item.applied_via,
        message_badge: meta?.message_badge || item.response_type,
        notes: meta?.notes,
      };

      await createReferral(payload);
    } catch (err: unknown) {
      // Fail quietly — local history is still saved and UI remains responsive
      console.error("Failed to persist referral record", err);
    }

    return item;
  }, [saveToHistory]);

  const generateOne = useCallback(async (payload: GenerateCommunicationPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateCommunication(payload);
      if (!result.success) throw new Error(result.error || "Generation failed");
      setResponses([result.data]);
      saveResponse(result.data, payload);
      return result.data;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to generate communication");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveResponse]);

  const generateBundle = useCallback(async (payload: GenerateCommunicationPayload, responseTypes?: ResponseType[]) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateAllCommunication({ ...payload, response_types: responseTypes });
      if (!result.success) throw new Error(result.error || "Bundle generation failed");
      setResponses(result.data.responses);
      result.data.responses.forEach((response) => saveResponse(response, payload));
      return result.data.responses;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to generate bundle");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveResponse]);

  const analyze = useCallback(async (job_description: string, job_role?: string) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeJD({ job_description, job_role });
      if (!result.success) throw new Error(result.error || "JD analysis failed");
      setAnalysis(result.data);
      return result.data;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to analyze JD");
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const regenerate = useCallback(async (payload: GenerateCommunicationPayload) => {
    if (payload.response_type === "custom_response_type") {
      return generateOne(payload);
    }
    return generateOne(payload);
  }, [generateOne]);

  const toggleFavorite = useCallback((responseType: string) => {
    setFavorites((prev) => (prev.includes(responseType) ? prev.filter((item) => item !== responseType) : [responseType, ...prev]));
  }, []);

  const clearResults = useCallback(() => setResponses([]), []);

  const prioritizedBundles = useMemo(() => templates?.smart_bundles || {}, [templates]);

  return {
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
    clearResults,
    saveResponse,
    setTemplates,
    prioritizedBundles,
    setResponses,
    setAnalysis,
    setError,
    getSmartBundle: (appliedVia: AppliedVia) => getSmartBundle(appliedVia, templates),
  };
}
