from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .constants import RESPONSE_TEMPLATES, TONE_OPTIONS

ResponseType = Literal[
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
]

AppliedVia = Literal["linkedin", "careers_page", "referral", "naukri", "indeed", "instahyre", "other"]
ToneType = Literal["professional", "friendly", "confident", "concise"]


class GenerateCommunicationRequest(BaseModel):
    job_description: str = Field(min_length=1)
    company_name: str | None = None
    job_role: str | None = None
    applied_via: AppliedVia | None = None
    recruiter_name: str | None = None
    hiring_manager_name: str | None = None
    response_type: ResponseType | None = None
    tone: ToneType | None = "professional"
    custom_response_type: str | None = None

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, value: str) -> str:
        if value not in TONE_OPTIONS:
            raise ValueError(f"tone must be one of: {', '.join(TONE_OPTIONS)}")
        return value

    @field_validator("custom_response_type")
    @classmethod
    def normalize_custom_response_type(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class GenerateAllRequest(GenerateCommunicationRequest):
    response_types: list[ResponseType] | None = None


class GenerateResponseData(BaseModel):
    response_type: str
    generated_content: str
    detected_skills: list[str] = Field(default_factory=list)
    matched_user_skills: list[str] = Field(default_factory=list)
    confidence_score: float = 0.85
    tone: ToneType = "professional"
    applied_via: AppliedVia = "other"


class GenerateResponseEnvelope(BaseModel):
    success: bool = True
    data: GenerateResponseData


class GenerateAllData(BaseModel):
    responses: list[GenerateResponseData]
    prioritized_response_types: list[str] = Field(default_factory=list)


class GenerateAllEnvelope(BaseModel):
    success: bool = True
    data: GenerateAllData


class AnalyzeJDRequest(BaseModel):
    job_description: str = Field(min_length=1)
    job_role: str | None = None
    company_name: str | None = None


class AnalyzeJDData(BaseModel):
    skills: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    experience_level: str = "unknown"
    suggested_improvements: list[str] = Field(default_factory=list)
    company_name: str | None = None
    job_role: str | None = None
    job_link: str | None = None


class AnalyzeJDEnvelope(BaseModel):
    success: bool = True
    data: AnalyzeJDData


class ResponseTemplateItem(BaseModel):
    response_type: str
    label: str
    channel: str
    description: str
    priority_for: list[str] = Field(default_factory=list)


class TemplatesData(BaseModel):
    templates: list[ResponseTemplateItem]
    tones: list[str]
    smart_bundles: dict[str, list[str]]


class TemplatesEnvelope(BaseModel):
    success: bool = True
    data: TemplatesData


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: str


def is_known_response_type(response_type: str) -> bool:
    return response_type in RESPONSE_TEMPLATES
