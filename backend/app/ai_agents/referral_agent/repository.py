import logging
from sqlalchemy import select

from app.db.models import (
    JobAIResult,
    ReferralCampaign
)

logger = logging.getLogger(__name__)

class ReferralRepository:

    def __init__(
        self,
        session
    ):

        self.session = session


    async def get_fresher_jobs(
        self,
        user_id: int
    ):
        try:
           

            query = (
                select(JobAIResult)
                .where(

                    JobAIResult.is_fresher
                    == True,

                    JobAIResult.user_id
                    == user_id,

                    JobAIResult.feed_published
                    == False
                )
            )

            result = await self.session.execute(
                query
            )

            jobs = result.scalars().all()

            

            return jobs
        except Exception as e:
            logger.error(f"ReferralRepository.get_fresher_jobs error: {e}")
            return []


    async def save_campaign(
        self,
        payload,
        user_id: int
    ):
        try:
            existing_query = (
                select(ReferralCampaign)
                .where(

                    ReferralCampaign.job_hash
                    == payload["job_hash"],

                    ReferralCampaign.user_id
                    == user_id
                )
            )

            existing_result = (
                await self.session.execute(
                    existing_query
                )
            )

            existing = (
                existing_result
                .scalar_one_or_none()
            )

            if existing:

               
                return

            campaign = ReferralCampaign(

                user_id=user_id,

                **payload
            )

            self.session.add(campaign)

            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error(f"ReferralRepository.save_campaign error: {e}")

    async def mark_feed_published(

        self,

        job_hash: str,

        user_id: int
    ):
        try:
            query = (
                select(JobAIResult)
                .where(

                    JobAIResult.job_hash
                    == job_hash,

                    JobAIResult.user_id
                    == user_id
                )
            )

            result = await self.session.execute(
                query
            )

            job = result.scalar_one_or_none()

            if not job:
                return

            job.feed_published = True

            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error(f"ReferralRepository.mark_feed_published error: {e}")