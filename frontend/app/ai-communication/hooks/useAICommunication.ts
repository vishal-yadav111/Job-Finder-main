"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeJD, fetchTemplates, generateAllCommunication, generateCommunication } from "../../lib/aiCommunicationApi";
import { createReferral } from "../../lib/api";
import type {
  AnalyzeJDResult,
  AppliedVia,
  CommunicationTemplate,
  GenerateCommunicationPayload,
  ResponseItem,
  ResponseType,
  ToneType,
  TemplatesResult,
} from "../../types/aiCommunication";

const HISTORY_KEY = "ai-communication-history";
const FAVORITES_KEY = "ai-communication-favorites";

function extractFirstUrl(text?: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/https?:\/\/[^\s)\]]+/i);
  return match?.[0]?.replace(/[.,;]+$/, "");
}

function extractCompanyName(jobDescription?: string): string | undefined {
  if (!jobDescription) return undefined;

  const patterns = [
    /(?:company|organization|employer)\s*[:\-]\s*([A-Za-z0-9&.,()\-\s]{2,80})/i,
    /(?:at|join|for)\s+([A-Z][A-Za-z0-9&.,()\-\s]{1,60})(?:\s+(?:as|to|for|is|are|seeks|seeking|looking))?/i,
    /([A-Z][A-Za-z0-9&.,()\-]{1,40}(?:\s+[A-Z][A-Za-z0-9&.,()\-]{1,40}){0,3})\s+(?:is|are)\s+(?:hiring|looking|seeking)/i,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) {
      return candidate.replace(/\s+/g, " ");
    }
  }

  return undefined;
}

function extractJobRole(jobDescription?: string): string | undefined {
  if (!jobDescription) return undefined;

  const patterns = [
    /(?:job role|role|position|title)\s*[:\-]\s*([A-Za-z0-9&.,()\-/\s]{2,80})/i,
    /(?:for the|for an?|as an?|as a)\s+([A-Za-z0-9&.,()\-/]{2,80})\s+(?:role|position|opening|opportunity)/i,
    /we are hiring for\s+([A-Za-z0-9&.,()\-/\s]{2,80})/i,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) {
      return candidate.replace(/\s+/g, " ");
    }
  }

  return undefined;
}

function buildResolvedMetadata(meta?: Record<string, any>) {
  const jobDescription = String(meta?.job_description || "").trim();
  const explicitCompany = String(meta?.company_name || "").trim();
  const explicitRole = String(meta?.job_role || "").trim();
  const explicitLink = String(meta?.job_link || "").trim();

  const extractedCompany = extractCompanyName(jobDescription);
  const extractedRole = extractJobRole(jobDescription);
  const extractedLink = extractFirstUrl(jobDescription);

  const companyName = explicitCompany || extractedCompany || "Unknown Company";
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
  const [history, setHistory] = useState<ResponseItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates().then((result) => {
      if (result.success) {
        setTemplates(result.data);
      }
    }).catch(() => undefined);

    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch {
      // localStorage is optional; ignore parse failures.
    }
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

  const saveResponse = useCallback(async (item: ResponseItem, meta?: Record<string, any>) => {
    saveToHistory(item);

    // Attempt to persist the generated response to the backend as a referral/application record
    try {
      const { companyName, jobRole, jobLink } = buildResolvedMetadata(meta);

      const payload = {
        company: companyName,
        role: jobRole,
        job_link: jobLink,
        recruiter_name: meta?.recruiter_name || undefined,
        linkedin_profiles: meta?.linkedin_profiles || [],
        referral_message: item.generated_content,
        status: meta?.status || "generated_applied",
        platform_applied: meta?.platform_applied || meta?.applied_via || item.applied_via,
        message_badge: meta?.message_badge || item.response_type,
        notes: meta?.notes,
      };

      await createReferral(payload);
    } catch (err) {
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
    } catch (err: any) {
      setError(err?.message || "Failed to generate communication");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const generateBundle = useCallback(async (payload: GenerateCommunicationPayload, responseTypes?: ResponseType[]) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateAllCommunication({ ...payload, response_types: responseTypes });
      if (!result.success) throw new Error(result.error || "Bundle generation failed");
      setResponses(result.data.responses);
      result.data.responses.forEach((response) => saveResponse(response, payload));
      return result.data.responses;
    } catch (err: any) {
      setError(err?.message || "Failed to generate bundle");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const analyze = useCallback(async (job_description: string, job_role?: string) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeJD({ job_description, job_role });
      if (!result.success) throw new Error(result.error || "JD analysis failed");
      setAnalysis(result.data);
      return result.data;
    } catch (err: any) {
      setError(err?.message || "Failed to analyze JD");
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
