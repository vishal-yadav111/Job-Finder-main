import logging
from app.db.connection import AsyncSessionLocal
from app.ai_agents.job_filtering.repository import JobFilteringRepository
from app.ai_agents.job_filtering.service import JobFilteringService

logger = logging.getLogger("job_filtering.runner")

async def run_job_filtering_agent():
    """Top-level process manager. Ensures database connections close cleanly during unhandled issues."""
    try:
        try:
            async with AsyncSessionLocal() as session:
                repository = JobFilteringRepository(session)
                service = JobFilteringService(repository)
                await service.process_jobs()
        except Exception as e:
            logger.critical(f"Fatal connection exception caught at global agent orchestration layer level: {e}")
    except Exception as e:
        # Final catch-all for any exceptions occurring outside the session context
        logger.error(f"Unexpected orchestration failure: {e}")