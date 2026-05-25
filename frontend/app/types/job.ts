export type JobStatus =
  | "no_action"
  | "applied"
  | "referral_requested"
  | "interview"
  | "hr_round"
  | "rejected"
  | "selected"
  | "closed";


export interface LinkedinProfile {
  name: string;
  linkedin_url: string;
  current_role: string | null;
}

export interface Job {
  job_hash: string;
  company: string;
  role: string;
  job_link: string;
  linkedin_profiles: LinkedinProfile[]; 
  referral_message: string;
  status: JobStatus;
  notes: string | null;
  created_at?: string;
}

export interface ScanStatusResponse {
  status: "started" | "stopped";
}