"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeJD, fetchTemplates, generateAllCommunication, generateCommunication } from "../../lib/aiCommunicationApi";
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

  const saveResponse = useCallback((item: ResponseItem) => {
    saveToHistory(item);
    return item;
  }, [saveToHistory]);

  const generateOne = useCallback(async (payload: GenerateCommunicationPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateCommunication(payload);
      if (!result.success) throw new Error(result.error || "Generation failed");
      setResponses([result.data]);
      saveResponse(result.data);
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
      result.data.responses.forEach(saveResponse);
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
