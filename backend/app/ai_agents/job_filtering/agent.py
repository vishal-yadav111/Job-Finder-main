import asyncio
import logging
import re
from app.ai_agents.shared.llm_client import client
from app.ai_agents.job_filtering.prompt import SYSTEM_PROMPT
from app.ai_agents.job_filtering.parser import parse_llm_response

logger = logging.getLogger("job_filtering.agent")

NEGATIVE_CLASSIFICATION = {
    "is_fresher": False,
    "experience_years": None,
    "role_category": None,
    "is_india_eligible": None,
    "salary_detected": False,
    "salary_lpa": None,
    "confidence": 0.0,
}

FRESHER_ACCEPT_PATTERNS = [
    r"\b0\s*(?:-|to|–)\s*1\s*(?:year|years|yr|yrs)\b",
    r"\b0\s*(?:year|years|yr|yrs)\b",
    r"\b1\s*(?:year|years|yr|yrs)\s*(?:of\s*)?(?:experience|exp)\b",
    r"\b(?:fresher|freshers|fresh graduate|new graduate|entry level|entry-level|graduate program|graduate trainee|trainee|intern)\b",
]

FRESHER_REJECT_PATTERNS = [
    r"\b(?:2|3|4|5|6|7|8|9)\s*\+?\s*(?:year|years|yr|yrs)\b",
    r"\b1\s*(?:-|to|–)\s*[2-9]\s*(?:year|years|yr|yrs)\b",
    r"\b(?:minimum|min|at least|more than|over|greater than)\s*1\s*(?:year|years|yr|yrs)\b",
    r"\b1\s*\+\s*(?:year|years|yr|yrs)\b",
    r"\b(?:senior|staff|lead|principal|manager|architect)\b",
]


def _normalize_text(raw_job) -> str:
    return " ".join(
        part for part in [
            getattr(raw_job, "title", "") or "",
            getattr(raw_job, "company", "") or "",
            getattr(raw_job, "location", "") or "",
            getattr(raw_job, "raw_description", "") or "",
        ]
        if part
    ).lower()


def _matches_fresher_range(text: str) -> bool | None:
    if not text:
        return None

    for pattern in FRESHER_REJECT_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return False

    for pattern in FRESHER_ACCEPT_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return True

    return None


def _build_negative_result() -> dict:
    return dict(NEGATIVE_CLASSIFICATION)


def _normalize_classification(ai_output: dict | None, text_hint: bool | None) -> dict | None:
    if not ai_output:
        return None

    experience_years = ai_output.get("experience_years")

    try:
        if isinstance(experience_years, str) and experience_years.strip():
            experience_years = float(experience_years)
    except Exception:
        experience_years = None

    if experience_years is not None and experience_years > 1:
        return _build_negative_result()

    if text_hint is False:
        return _build_negative_result()

    if text_hint is True or experience_years is not None:
        normalized = dict(ai_output)
        normalized["is_fresher"] = True
        normalized["experience_years"] = int(experience_years) if experience_years is not None else 1
        return normalized

    return _build_negative_result()

class JobFilteringAgent:
    async def classify_job(self, raw_job) -> dict | None:
        """
        Submits job context to the LLM endpoint using run_in_executor 
        to ensure the synchronous client call does not block the async loop.
        """
        try:
            description = (raw_job.raw_description or "")[:4000]
            title_lower = (raw_job.title or "").lower()
            text_hint = _matches_fresher_range(_normalize_text(raw_job))

            if text_hint is False:
                return _build_negative_result()

            if any(
                keyword in title_lower
                for keyword in ["senior", "staff", "lead", "principal", "manager", "architect"]
            ):
                return _build_negative_result()

           
            user_prompt = (
                f"Company: {raw_job.company}\n"
                f"Title: {raw_job.title}\n"
                f"Location: {raw_job.location}\n"
                f"Description:\n{description}\n"
            )

            # Safeguard the loop by executing the synchronous API call in an executor thread
            loop = asyncio.get_running_loop()
            
            # Note: Ensure client has default timeouts set, or add extra request configurations
            logger.info(
                f"Sending job to LLM: "
                f"{raw_job.title}"
            )
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: client.chat.completions.create(
                        model="openai/gpt-oss-20b",
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.1 # Enforce deterministic outputs
                    )
                )

                content = response.choices[0].message.content if response.choices else None
                if not content:
                    return None

                logger.info(
                    f"LLM response received for: "
                    f"{raw_job.title}"
                )

                parsed = parse_llm_response(content)
                return _normalize_classification(parsed, text_hint)
            except Exception as api_e:
                logger.error(f"External LLM API call failed for job {raw_job.title}: {api_e}")
                return None

        except Exception as e:
            logger.error(f"LLM API invocation failed completely for job {getattr(raw_job, 'id', 'unknown')}: {e}")
            return None