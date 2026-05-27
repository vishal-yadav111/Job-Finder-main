import axios from "axios";
import type {
  AnalyzeJDResult,
  ApiEnvelope,
  GenerateCommunicationPayload,
  ResponseItem,
  ResponseType,
  TemplatesResult,
} from "../types/aiCommunication";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function generateCommunication(payload: GenerateCommunicationPayload): Promise<ApiEnvelope<ResponseItem>> {
  const { data } = await client.post<ApiEnvelope<ResponseItem>>("/api/ai-communication/generate", payload);
  return data;
}

export async function generateAllCommunication(
  payload: GenerateCommunicationPayload & { response_types?: ResponseType[] },
): Promise<ApiEnvelope<{ responses: ResponseItem[]; prioritized_response_types: string[] }>> {
  const { data } = await client.post<ApiEnvelope<{ responses: ResponseItem[]; prioritized_response_types: string[] }>>(
    "/api/ai-communication/generate-all",
    payload,
  );
  return data;
}

export async function analyzeJD(payload: { job_description: string; job_role?: string }): Promise<ApiEnvelope<AnalyzeJDResult>> {
  const { data } = await client.post<ApiEnvelope<AnalyzeJDResult>>("/api/ai-communication/analyze-jd", payload);
  return data;
}

export async function fetchTemplates(): Promise<ApiEnvelope<TemplatesResult>> {
  const { data } = await client.get<ApiEnvelope<TemplatesResult>>("/api/ai-communication/templates");
  return data;
}
