import logging
from sqlalchemy import select

from app.db.models import (
    LinkedinProfile
)

logger = logging.getLogger(__name__)

class LinkedinFinderRepository:

    def __init__(
        self,
        session
    ):

        self.session = session


    async def get_company_profiles(

        self,

        company: str,

        user_id: int
    ):
        try:
            query = (
                select(LinkedinProfile)
                .where(

                    LinkedinProfile.company
                    == company,

                    LinkedinProfile.user_id
                    == user_id
                )
            )

            result = await self.session.execute(
                query
            )

            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching LinkedIn profiles: {e}")
            return []


    async def save_profiles(

        self,

        company: str,

        profiles: list,

        user_id: int
    ):
        try:
            for profile in profiles:

                existing_query = (
                    select(LinkedinProfile)
                    .where(

                        LinkedinProfile.linkedin_url
                        == profile["linkedin_url"],

                        LinkedinProfile.user_id
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
                    continue

                db_profile = LinkedinProfile(

                    user_id=user_id,

                    company=company,

                    name=profile["name"],

                    linkedin_url=profile[
                        "linkedin_url"
                    ],

                    current_role=profile[
                        "current_role"
                    ]
                )

                self.session.add(
                    db_profile
                )

            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error saving LinkedIn profiles: {e}")


    async def company_profiles_exist(

        self,

        company: str,

        user_id: int
    ):
        try:
            profiles = (
                await self.get_company_profiles(

                    company,

                    user_id
                )
            )

            return len(profiles) > 0
        except Exception as e:
            logger.error(f"Error checking profile existence: {e}")
            return False