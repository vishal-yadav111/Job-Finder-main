from __future__ import annotations

import asyncio
import logging
from functools import lru_cache

from openai import APIConnectionError, APIError, APITimeoutError, AsyncOpenAI, NotFoundError, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .constants import DEFAULT_MODEL, RESPONSE_TEMPLATES, SMART_BUNDLES, TONE_OPTIONS
from .formatter import clamp_confidence, normalize_text_list, parse_json_content
from .prompt_builder import (
    build_analysis_system_prompt,
    build_analysis_user_prompt,
    build_generate_system_prompt,
    build_generate_user_prompt,
    get_smart_bundle,
    get_template_metadata,
)
from .schemas import (
    AnalyzeJDData,
    AnalyzeJDRequest,
    GenerateAllData,
    GenerateAllRequest,
    GenerateCommunicationRequest,
    GenerateResponseData,
    ResponseTemplateItem,
    TemplatesData,
)
from .settings import AiCommunicationSettings, PromptContext

logger = logging.getLogger(__name__)


class AiCommunicationService:
    def __init__(self, settings: AiCommunicationSettings | None = None):
        self.settings = settings or get_settings()
        client_kwargs = {"api_key": self.settings.llm_api_key}
        if self.settings.openai_base_url:
            client_kwargs["base_url"] = self.settings.openai_base_url
        self.client = AsyncOpenAI(**client_kwargs)
        self.fallback_model = "llama-3.1-70b-versatile"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((APIError, APIConnectionError, APITimeoutError, RateLimitError)),
        reraise=True,
    )
    async def _chat_json(self, *, system_prompt: str, user_prompt: str) -> dict:
        logger.debug("Sending AI communication prompt to OpenAI")
        request_kwargs = {
            "model": self.settings.openai_model or DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
        }

        try:
            response = await self.client.chat.completions.create(**request_kwargs)
        except NotFoundError as first_error:
            if request_kwargs["model"] != self.fallback_model:
                logger.warning(
                    "Primary AI model %s unavailable, retrying with fallback model %s",
                    request_kwargs["model"],
                    self.fallback_model,
                )
                request_kwargs["model"] = self.fallback_model
                response = await self.client.chat.completions.create(**request_kwargs)
            else:
                raise first_error

        content = response.choices[0].message.content if response.choices else None
        if not content:
            raise ValueError("OpenAI returned an empty response")
        return parse_json_content(content)

    def _detected_skills_from_jd(self, job_description: str) -> list[str]:
        profile_skills = {skill.lower(): skill for skill in self.settings.user_profile.user_skills}
        if not profile_skills and self.settings.user_profile.profile_summary:
            summary = self.settings.user_profile.profile_summary.lower()
            for token in [
                "python", "javascript", "typescript", "c++", "react", "next.js", "nextjs",
                "node.js", "nodejs", "fastapi", "postgresql", "redis", "websocket", "websockets",
                "docker", "jwt", "rest api", "rest apis", "llm", "rag", "pinecone", "gemini",
            ]:
                if token in summary:
                    profile_skills[token] = token
        text = job_description.lower()
        detected = []
        for skill in profile_skills:
            if skill and skill in text:
                detected.append(profile_skills[skill])
        return detected

    def _matched_user_skills(self, detected_skills: list[str]) -> list[str]:
        profile_lookup = {skill.lower(): skill for skill in self.settings.user_profile.user_skills}
        matched = []
        for skill in detected_skills:
            key = skill.lower()
            if key in profile_lookup:
                matched.append(profile_lookup[key])
        return matched

    def _response_context(self, payload: GenerateCommunicationRequest) -> PromptContext:
        return PromptContext(
            company_name=payload.company_name.strip() if payload.company_name else "",
            job_role=payload.job_role.strip() if payload.job_role else "",
            job_description=payload.job_description.strip(),
            applied_via=payload.applied_via or "other",
            recruiter_name=payload.recruiter_name.strip() if payload.recruiter_name else None,
            hiring_manager_name=payload.hiring_manager_name.strip() if payload.hiring_manager_name else None,
            response_type=payload.response_type or "custom_response_type",
            tone=payload.tone or "professional",
            custom_response_type=payload.custom_response_type,
        )

    def _resolve_response_type(self, payload: GenerateCommunicationRequest) -> str:
        if payload.response_type:
            return payload.response_type

        applied_via = payload.applied_via or "other"
        return get_smart_bundle(applied_via)[0]

    async def generate_response(self, payload: GenerateCommunicationRequest) -> GenerateResponseData:
        context = self._response_context(payload)
        detected_skills = self._detected_skills_from_jd(context.job_description)
        response_type = self._resolve_response_type(payload)
        system_prompt = build_generate_system_prompt(self.settings.user_profile, get_template_metadata(response_type)["label"], context.tone)
        user_prompt = build_generate_user_prompt(context, detected_skills)
        raw_output = await self._chat_json(system_prompt=system_prompt, user_prompt=user_prompt)

        content = str(raw_output.get("generated_content", "")).strip() or str(raw_output.get("content", "")).strip()
        extracted_detected = normalize_text_list(raw_output.get("detected_skills")) or detected_skills
        matched = normalize_text_list(raw_output.get("matched_user_skills")) or self._matched_user_skills(extracted_detected)

        return GenerateResponseData(
            response_type=response_type,
            generated_content=content,
            detected_skills=extracted_detected,
            matched_user_skills=matched,
            confidence_score=clamp_confidence(raw_output.get("confidence_score", raw_output.get("confidence", 0.85))),
            tone=context.tone,
            applied_via=context.applied_via,
        )

    async def generate_all(self, payload: GenerateAllRequest) -> GenerateAllData:
        template_keys = payload.response_types or list(RESPONSE_TEMPLATES.keys())

        async def generate_for_type(response_type: str) -> GenerateResponseData:
            single_payload = payload.model_copy(update={"response_type": response_type})
            return await self.generate_response(single_payload)

        responses = await asyncio.gather(*(generate_for_type(response_type) for response_type in template_keys))

        prioritized = payload.response_types or template_keys
        return GenerateAllData(responses=list(responses), prioritized_response_types=prioritized)

    async def analyze_jd(self, payload: AnalyzeJDRequest) -> AnalyzeJDData:
        system_prompt = build_analysis_system_prompt(self.settings.user_profile)
        user_prompt = build_analysis_user_prompt(payload.job_description, payload.job_role)
        raw_output = await self._chat_json(system_prompt=system_prompt, user_prompt=user_prompt)

        return AnalyzeJDData(
            skills=normalize_text_list(raw_output.get("skills")),
            keywords=normalize_text_list(raw_output.get("keywords")),
            experience_level=str(raw_output.get("experience_level", "unknown")),
            suggested_improvements=normalize_text_list(raw_output.get("suggested_improvements")),
        )

    def list_templates(self) -> TemplatesData:
        templates = [
            ResponseTemplateItem(
                response_type=response_type,
                label=template["label"],
                channel=template["channel"],
                description=template["description"],
                priority_for=template.get("priority", []),
            )
            for response_type, template in RESPONSE_TEMPLATES.items()
        ]
        return TemplatesData(templates=templates, tones=list(TONE_OPTIONS), smart_bundles=SMART_BUNDLES)


@lru_cache(maxsize=1)
def get_settings() -> AiCommunicationSettings:
    return AiCommunicationSettings.from_env()


@lru_cache(maxsize=1)
def get_ai_communication_service() -> AiCommunicationService:
    return AiCommunicationService(get_settings())
