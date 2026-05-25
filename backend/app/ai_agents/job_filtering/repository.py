from datetime import datetime, timezone
import logging
from sqlalchemy import select, update
from app.db.models import RawJob, JobAIResult

logger = logging.getLogger("job_filtering.repository")

class JobFilteringRepository:
    def __init__(self, session):
        self.session = session

    async def get_unprocessed_jobs(self, limit=20):
        try:
            query = (

                select(RawJob)

                .where(
                    RawJob.llm_processed == False
                )

                .order_by(
                    RawJob.created_at.desc()
                )

                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Failed pulling down unvisited records from Database layer: {e}")
            return []

    async def mark_processed(self, job_hash: str):
        """Updates job state using safe native timezone assignments."""
        try:
            query = (
                update(RawJob)
                .where(RawJob.job_hash == job_hash)
                .values(
                    llm_processed=True,
                    llm_processed_at=datetime.now(timezone.utc).replace(tzinfo=None)
                )
            )
            await self.session.execute(query)
            # await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to mark job {job_hash} as processed: {e}")

    async def save_ai_result(self, raw_job, ai_output: dict):
        """Maps output keys to the model layer securely."""
        try:
            result = JobAIResult(
                user_id=raw_job.user_id,
                job_hash=raw_job.job_hash,
                company=raw_job.company,
                title=raw_job.title,
                location=raw_job.location,
                apply_url=raw_job.apply_url,
                posted_at=(

                    raw_job.posted_at.replace(
                        tzinfo=None
                    )

                    if raw_job.posted_at

                    else None
                ),
                is_fresher=ai_output.get("is_fresher"),
                experience_years=ai_output.get("experience_years"),
                role_category=ai_output.get("role_category"),
                is_india_eligible=ai_output.get("is_india_eligible"),
                salary_detected=ai_output.get("salary_detected"),
                salary_lpa=ai_output.get("salary_lpa"),
                confidence=ai_output.get("confidence"),
                llm_model="openai/gpt-oss-20b",
                processed_at=datetime.now(timezone.utc).replace(tzinfo=None)
            )
            self.session.add(result)
            await self.session.flush() 
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to save AI result for job {raw_job.job_hash}: {e}")