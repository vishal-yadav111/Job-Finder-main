"use client";

import type { CommunicationTemplate, AppliedVia, ResponseType, ToneType } from "../../types/aiCommunication";

interface PromptSelectorProps {
  templates: CommunicationTemplate[];
  responseType: ResponseType;
  tone: ToneType;
  appliedVia?: AppliedVia;
  onResponseTypeChange: (value: ResponseType) => void;
  onToneChange: (value: ToneType) => void;
}

type ChannelKey = "linkedin" | "whatsapp" | "email";

const PRIMARY_CHANNELS: Array<{
  key: ChannelKey;
  label: string;
  description: string;
}> = [
  {
    key: "linkedin",
    label: "LinkedIn Message",
    description: "Connection note, follow-up, or networking message.",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Message",
    description: "Short referral or outreach message for WhatsApp.",
  },
  {
    key: "email",
    label: "Email",
    description: "Referral mail, HR outreach, recruiter email, or cover letter.",
  },
];

const OPTIONAL_SECTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "linkedin", label: "More LinkedIn options" },
  { key: "email", label: "More Email options" },
  { key: "interview", label: "Interview answers" },
  { key: "other", label: "Other templates" },
];

function getTemplateMap(templates: CommunicationTemplate[]) {
  return templates.reduce<Record<string, CommunicationTemplate[]>>((acc, template) => {
    if (!acc[template.channel]) {
      acc[template.channel] = [];
    }
    acc[template.channel].push(template);
    return acc;
  }, {});
}

function getPrimaryTemplate(
  channel: ChannelKey,
  appliedVia: AppliedVia | undefined,
  groupedTemplates: Record<string, CommunicationTemplate[]>,
): CommunicationTemplate | undefined {
  const templates = groupedTemplates[channel] || [];

  if (channel === "linkedin") {
    return templates.find((item) => item.response_type === "linkedin_connection_message") ?? templates[0];
  }

  if (channel === "whatsapp") {
    return templates.find((item) => item.response_type === "whatsapp_referral_request") ?? templates[0];
  }

  if (channel === "email") {
    if (appliedVia === "referral") {
      return templates.find((item) => item.response_type === "referral_request_email") ?? templates[0];
    }

    if (appliedVia === "careers_page") {
      return templates.find((item) => item.response_type === "hr_outreach_message") ?? templates[0];
    }

    return (
      templates.find((item) => item.response_type === "cold_email_to_recruiter") ??
      templates.find((item) => item.response_type === "referral_request_email") ??
      templates[0]
    );
  }

  return templates[0];
}

export function PromptSelector({
  templates,
  responseType,
  tone,
  appliedVia,
  onResponseTypeChange,
  onToneChange,
}: PromptSelectorProps) {
  const groupedTemplates = getTemplateMap(templates);
  const activeTemplate = templates.find((template) => template.response_type === responseType);
  const activeChannel = activeTemplate?.channel ?? "email";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {PRIMARY_CHANNELS.map((channel) => {
          const template = getPrimaryTemplate(channel.key, appliedVia, groupedTemplates);
          const isActive = activeChannel === channel.key;

          return (
            <button
              key={channel.key}
              type="button"
              onClick={() => template && onResponseTypeChange(template.response_type)}
              className={`rounded-3xl border px-4 py-4 text-left transition ${
                isActive
                  ? "border-emerald-400/50 bg-emerald-400/10 shadow-lg shadow-emerald-500/10"
                  : "border-white/10 bg-slate-950/70 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Primary</p>
              <div className="mt-2 text-base font-semibold text-white">{channel.label}</div>
              <p className="mt-1 text-sm text-slate-400">{channel.description}</p>
              <p className="mt-3 text-xs text-emerald-200">
                Default: {template ? template.label : channel.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {OPTIONAL_SECTION_ORDER.map((section) => {
          const items = groupedTemplates[section.key] || [];
          const primaryResponseType =
            section.key === "linkedin" || section.key === "email" || section.key === "whatsapp"
              ? getPrimaryTemplate(section.key, appliedVia, groupedTemplates)?.response_type
              : items[0]?.response_type;

          const optionalItems = items.filter((item) => item.response_type !== primaryResponseType);

          if (!optionalItems.length) {
            return null;
          }

          return (
            <details key={section.key} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">{section.label}</summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {optionalItems.map((template) => {
                  const isActive = responseType === template.response_type;

                  return (
                    <button
                      key={template.response_type}
                      type="button"
                      onClick={() => onResponseTypeChange(template.response_type)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-sky-400/50 bg-sky-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-sm font-medium text-white">{template.label}</div>
                      <div className="mt-1 text-xs text-slate-400">{template.description}</div>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <label className="space-y-2 text-sm text-slate-200">
        <span>Tone</span>
        <select
          value={tone}
          onChange={(event) => onToneChange(event.target.value as ToneType)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400/40"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="confident">Confident</option>
          <option value="concise">Concise</option>
        </select>
      </label>
    </div>
  );
}
