import json
import re
import logging

logger = logging.getLogger("job_filtering.parser")

EXPECTED_KEYS = [
    "is_fresher",
    "experience_years",
    "role_category",
    "is_india_eligible",
    "salary_detected",
    "salary_lpa",
    "confidence"
]

def parse_llm_response(content: str) -> dict | None:
    """
    Cleans markdown code fences out of LLM responses and validates 
    the presence of key structural JSON layout requirements.
    """
    if not content or not isinstance(content, str):
        return None

    cleaned_content = content.strip()

    # Regex fallback to extract data inside markdown fences if the LLM adds them
    if "```" in cleaned_content:
        match = re.search(
            r"```(?:json)?\s*([\s\S]*?)\s*```",
            cleaned_content
        )
        if match:
            cleaned_content = match.group(1).strip()

    try:
        data = json.loads(cleaned_content)
        if not isinstance(data, dict):
            return None
            
        # Ensure fallback defaults exist for required schema keys if keys are dropped
        for key in EXPECTED_KEYS:
            if key not in data:
                data[key] = None
                
        return data
    except Exception as e:
        logger.error(f"Failed to decode LLM response stream to valid JSON dict object: {e}")
        return None