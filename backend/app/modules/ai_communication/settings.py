from __future__ import annotations

import os
from dataclasses import dataclass

from pydantic import BaseModel, EmailStr, Field, field_validator


def _optional_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _first_env(*names: str) -> str | None:
    for name in names:
        value = _optional_env(name)
        if value is not None:
            return value
    return None


def _required_env(name: str) -> str:
    value = _optional_env(name)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _split_list(value: str) -> list[str]:
    return [item.strip() for item in value.replace("\n", ",").split(",") if item.strip()]


class UserProfileConfig(BaseModel):
    user_name: str | None = None
    user_email: EmailStr | None = None
    user_phone: str | None = None
    user_linkedin: str | None = None
    user_github: str | None = None
    user_portfolio: str | None = None
    user_resume: str | None = None
    user_skills: list[str] = Field(default_factory=list)
    user_experience: str | None = None
    user_college: str | None = None
    user_degree: str | None = None
    user_grad_year: str | None = None
    profile_summary: str | None = None

    @field_validator("user_skills", mode="before")
    @classmethod
    def validate_skills(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return [item.strip() for item in value if item and item.strip()]
        return _split_list(value)


class AiCommunicationSettings(BaseModel):
    llm_api_key: str = Field(min_length=1)
    openai_model: str = "llama-3.1-8b-instant"
    openai_base_url: str | None = None
    user_profile: UserProfileConfig

    @classmethod
    def from_env(cls) -> "AiCommunicationSettings":
        profile = UserProfileConfig(
            user_name=_first_env("USER_NAME", "FULL_NAME"),
            user_email=_first_env("USER_EMAIL", "EMAIL"),
            user_phone=_first_env("USER_PHONE", "PHONE"),
            user_linkedin=_first_env("USER_LINKEDIN", "LINKEDIN", "RESUME_LINKEDIN"),
            user_github=_first_env("USER_GITHUB", "GITHUB", "GITHUB_URL"),
            user_portfolio=_first_env("USER_PORTFOLIO", "PORTFOLIO"),
            user_resume=_first_env("USER_RESUME", "RESUME"),
            user_skills=_first_env("USER_SKILLS", "SKILLS") or "",
            user_experience=_first_env("USER_EXPERIENCE", "EXPERIENCE", "PROFILE_EXPERIENCE"),
            user_college=_first_env("USER_COLLEGE", "COLLEGE", "UNIVERSITY"),
            user_degree=_first_env("USER_DEGREE", "DEGREE"),
            user_grad_year=_first_env("USER_GRAD_YEAR", "GRAD_YEAR"),
            profile_summary=_first_env("PROFILE_SUMMARY"),
        )

        groq_key = _first_env("GROQ_API_KEY")
        if groq_key is None:
            raise RuntimeError("Missing required environment variable: GROQ_API_KEY")

        return cls(
            llm_api_key=groq_key,
            openai_model="llama-3.1-8b-instant",
            openai_base_url=_first_env("OPENAI_BASE_URL") or "https://api.groq.com/openai/v1",
            user_profile=profile,
        )


@dataclass(frozen=True)
class PromptContext:
    company_name: str
    job_role: str
    job_description: str
    applied_via: str
    recruiter_name: str | None
    hiring_manager_name: str | None
    response_type: str
    tone: str
    custom_response_type: str | None = None
