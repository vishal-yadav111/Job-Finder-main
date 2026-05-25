from datetime import datetime
from datetime import timedelta

from sqlalchemy import delete

from app.db.connection import (
    AsyncSessionLocal
)

from app.db.models import (
    RawJob,
    JobAIResult,
    ReferralCampaign
)


async def cleanup_old_jobs():
    try:
        cutoff = (
            datetime.utcnow()
            - timedelta(days=3)
        )

        async with AsyncSessionLocal() as session:
            try:
                await session.execute(
                    delete(RawJob)
                    .where(
                        RawJob.created_at < cutoff
                    )
                )

                await session.execute(
                    delete(JobAIResult)
                    .where(
                        JobAIResult.processed_at
                        < cutoff
                    )
                )

                await session.execute(
                    delete(ReferralCampaign)
                    .where(
                        ReferralCampaign.created_at
                        < cutoff
                    )
                )

                await session.commit()
            except Exception:
                await session.rollback()
                raise
    except Exception:
        # Silently log or handle the error to ensure the calling service remains stable
        pass