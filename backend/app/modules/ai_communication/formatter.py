from __future__ import annotations

import json
import re
from typing import Any


def _strip_code_fences(content: str) -> str:
    cleaned = content.strip()
    if "```" not in cleaned:
        return cleaned

    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        return match.group(1).strip()
    return cleaned.replace("```json", "").replace("```", "").strip()


def parse_json_content(content: str) -> dict[str, Any]:
    cleaned = _strip_code_fences(content)
    data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise ValueError("Expected JSON object from model")
    return data


def normalize_text_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        parts = re.split(r"[,;\n]+", value)
        return [part.strip() for part in parts if part.strip()]
    return [str(value).strip()] if str(value).strip() else []


def clamp_confidence(value: Any, default: float = 0.85) -> float:
    try:
        confidence = float(value)
    except Exception:
        confidence = default
    return max(0.0, min(1.0, confidence))


def build_response_payload(
    *,
    response_type: str,
    generated_content: str,
    detected_skills: list[str],
    matched_user_skills: list[str],
    confidence_score: float,
    tone: str,
    applied_via: str,
) -> dict[str, Any]:
    return {
        "response_type": response_type,
        "generated_content": generated_content.strip(),
        "detected_skills": detected_skills,
        "matched_user_skills": matched_user_skills,
        "confidence_score": clamp_confidence(confidence_score),
        "tone": tone,
        "applied_via": applied_via,
    }
