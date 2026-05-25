import logging
from app.ai_agents.job_filtering.agent import JobFilteringAgent


logger = logging.getLogger("job_filtering.service")

class JobFilteringService:
    def __init__(self, repository):
        self.repository = repository
        self.agent = JobFilteringAgent()

    async def process_jobs(self):
        try:
            jobs = await self.repository.get_unprocessed_jobs()
            if not jobs:
                return

            for job in jobs:
                # Wrap individual items in isolated try-except scopes to ensure the loop survives failures
                try:

                    ai_output = await self.agent.classify_job(
                        job
                    )

                    if not ai_output:

                        logger.warning(
                            f"Failed parsing output for: "
                            f"{job.title}"
                        )

                        ai_output = {

                            "is_fresher": None,

                            "experience_years": None,

                            "role_category": None,

                            "is_india_eligible": None,

                            "salary_detected": None,

                            "salary_lpa": None,

                            "confidence": 0.5
                        }

                    # if any(
                    #     val is not None
                    #     for val in ai_output.values()
                    # ):

                    await self.repository.save_ai_result(
                        job,
                        ai_output
                    )

                    await self.repository.mark_processed(
                        job.job_hash
                    )
                    # await self.repository.session.commit()
                    logger.info(
                        f"Processed AI job: "
                        f"{job.title}"
                    )

                except Exception as item_error:

                    logger.error(
                        f"Pipeline failure for "
                        f"{job.title}: "
                        f"{item_error}"
                    )

                    try:
                        await self.repository.session.rollback()

                    except Exception:
                        pass

                    continue
            await self.repository.session.commit()
            
        except Exception as e:
            logger.critical(f"Service-level failure in process_jobs: {e}")