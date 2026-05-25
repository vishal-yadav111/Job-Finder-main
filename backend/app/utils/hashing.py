import hashlib
import re


def normalize_text(value: str) -> str:
    if not value:
        return ""

    value = value.lower().strip()

    value = re.sub(r"\s+", " ", value)

    return value


def generate_job_hash(
    company: str,
    title: str,
    location: str,
    apply_url: str
):
    company = normalize_text(company)
    title = normalize_text(title)
    location = normalize_text(location)

    raw = (
        f"{company}|"
        f"{title}|"
        f"{location}|"
        f"{apply_url}"
    )

    return hashlib.sha256(
        raw.encode()
    ).hexdigest()