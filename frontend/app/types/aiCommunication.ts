export type ToneType = "professional" | "friendly" | "confident" | "concise";

export type AppliedVia = "linkedin" | "careers_page" | "referral" | "naukri" | "indeed" | "instahyre" | "other";

export type ResponseType =
  | "referral_request_email"
  | "linkedin_connection_message"
  | "linkedin_follow_up_message"
  | "whatsapp_referral_request"
  | "hr_outreach_message"
  | "cold_email_to_recruiter"
  | "tell_me_about_yourself"
  | "why_do_you_want_to_join_our_company"
  | "short_interview_introduction"
  | "cover_letter"
  | "follow_up_after_applying"
  | "thank_you_message_after_interview"
  | "networking_message"
  | "referral_follow_up_message"
  | "custom_response_type";

export interface CommunicationTemplate {
  response_type: ResponseType;
  label: string;
  channel: string;
  description: string;
  priority_for: AppliedVia[];
}

export interface GenerateCommunicationPayload {
  company_name?: string;
  job_role?: string;
  job_description: string;
  applied_via?: AppliedVia;
  recruiter_name?: string;
  hiring_manager_name?: string;
  response_type?: ResponseType;
  tone?: ToneType;
  custom_response_type?: string;
}

export interface ResponseItem {
  response_type: ResponseType;
  generated_content: string;
  detected_skills: string[];
  matched_user_skills: string[];
  confidence_score: number;
  tone: ToneType;
  applied_via: AppliedVia;
}

export interface AnalyzeJDResult {
  skills: string[];
  keywords: string[];
  experience_level: string;
  suggested_improvements: string[];
  company_name?: string | null;
  job_role?: string | null;
  job_link?: string | null;
}

export interface TemplatesResult {
  templates: CommunicationTemplate[];
  tones: ToneType[];
  smart_bundles: Record<string, ResponseType[]>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}
