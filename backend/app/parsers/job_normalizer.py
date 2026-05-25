import re
import logging

from app.utils.hashing import generate_job_hash
from app.utils.dates import parse_datetime

# Setup basic error logging layout so failures don't drop silent but won't crash execution
logger = logging.getLogger("job_normalizer")


def clean_text(value) -> str:
    if not value or not isinstance(value, str):
        return ""
    return re.sub(r"\s+", " ", value.strip())


def normalize_title(title) -> str:
    return clean_text(title).lower()


def normalize_location(location) -> str:
    return clean_text(location).lower()


def build_normalized_job(
    source, source_job_id, company, title, location, apply_url, raw_description, posted_at=None
):
    """
    Constructs a standardized dict schema. 
    Catches processing errors locally to prevent whole pipeline failure.
    """
    try:
        cleaned_title = clean_text(title)
        cleaned_location = clean_text(location)
        cleaned_desc = clean_text(raw_description)
        
        # Guard against completely empty companies or IDs causing broken models downstream
        safe_company = str(company).lower() if company else "unknown"
        safe_source_id = str(source_job_id) if source_job_id is not None else ""

        # Safely run datetime parser
        try:
            parsed_date = parse_datetime(posted_at)
        except Exception:
            parsed_date = None

        normalized = {
            "source": str(source),
            "source_job_id": safe_source_id,
            "company": safe_company,
            "title": cleaned_title,
            "normalized_title": cleaned_title.lower(),
            "location": cleaned_location,
            "normalized_location": cleaned_location.lower(),
            "apply_url": str(apply_url) if apply_url else "",
            "posted_at": parsed_date,
            "raw_description": cleaned_desc
        }

        # Safely compute unique tracking hash
        try:
            normalized["job_hash"] = generate_job_hash(
                company=normalized["company"],
                title=normalized["normalized_title"],
                location=normalized["normalized_location"],
                apply_url=normalized["apply_url"]
            )
        except Exception as e:
            # Fallback hash if your utility generator fails due to unexpected formatting parameters
            normalized["job_hash"] = f"{normalized['source']}_{normalized['source_job_id']}"

        return normalized

    except Exception as e:
        logger.error(f"Failed completely building normalized dict. Error: {str(e)}")
        return None


def normalize_greenhouse_job(job, company_name):
    """Safely extracts greenhouse payload elements."""
    if not isinstance(job, dict):
        return None
    try:
        return build_normalized_job(
            source="greenhouse",
            source_job_id=job.get("id"),
            company=company_name,
            title=job.get("title"),
            location=job.get("location", {}).get("name") if isinstance(job.get("location"), dict) else "",
            apply_url=job.get("absolute_url"),
            raw_description=job.get("content", ""),
            posted_at=job.get("updated_at")
        )
    except Exception as e:
        logger.error(f"Error handling greenhouse normalization: {e}")
        return None


def normalize_lever_job(job, company_name):
    """Safely extracts lever payload elements."""
    if not isinstance(job, dict):
        return None
    try:
        categories = job.get("categories") or {}
        return build_normalized_job(
            source="lever",
            source_job_id=job.get("id"),
            company=company_name,
            title=job.get("text"),
            location=categories.get("location") if isinstance(categories, dict) else "",
            apply_url=job.get("hostedUrl"),
            raw_description=job.get("descriptionPlain", ""),
            posted_at=job.get("createdAt")
        )
    except Exception as e:
        logger.error(f"Error handling lever normalization: {e}")
        return None
    

def normalize_workday_job(
    job,
    company_name
):

    if not isinstance(job, dict):
        return None

    try:

        return build_normalized_job(

            source="workday",

            source_job_id=job.get(
                "externalPath"
            ),

            company=company_name,

            title=job.get("title"),

            location=job.get(
                "locationsText"
            ),

            apply_url=job.get(
                "externalPath"
            ),

            raw_description="",

            posted_at=job.get(
                "postedOn"
            )
        )

    except Exception as e:

        logger.error(
            f"Workday normalization error: {e}"
        )

        return None
    

def normalize_ashby_job(
    job,
    company_name
):
    if not isinstance(job, dict):
        return None
    
    try:
    
        return build_normalized_job(

            source="ashby",

            source_job_id=job.get("id"),

            company=company_name,

            title=job.get("title"),

            location=job.get(
                "locationName"
            ),

            apply_url=job.get(
                "applyUrl"
            ),

            raw_description=job.get(
                "descriptionHtml", ""
            ),

            posted_at=job.get(
                "publishedAt"
            )
        )
    except Exception as e:

        logger.error(
            f"Ashby normalization error: {e}"
        )

        return None