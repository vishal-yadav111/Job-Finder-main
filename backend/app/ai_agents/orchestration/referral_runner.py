import logging

from app.db.connection import (
    AsyncSessionLocal
)

from app.ai_agents.referral_agent.repository import (
    ReferralRepository
)

from app.ai_agents.linkedin_finder.finder import (
    LinkedinProfileFinder
)

from app.ai_agents.linkedin_finder.repository import (
    LinkedinFinderRepository
)

from app.ai_agents.referral_agent.generator import (
    ReferralMessageGenerator
)

from app.ai_agents.shared.websocket_manager import (
    broadcast_to_user
)

from app.cache.feed_manager import (
    feed_manager
)

logger = logging.getLogger(
    "referral_runner"
)


async def run_referral_pipeline(user_id: int):
    try:
        logger.info(
            "Starting referral pipeline"
        )

        async with AsyncSessionLocal() as session:

            repository = ReferralRepository(
                session
            )

            linkedin_repository = (
                LinkedinFinderRepository(
                    session
                )
            )

            finder = LinkedinProfileFinder()

            generator = (
                ReferralMessageGenerator()
            )

            jobs = (
                await repository
                .get_fresher_jobs(user_id=user_id)
            )

            logger.info(
                f"Total fresher jobs: "
                f"{len(jobs)}"
            )

            for job in jobs:

                try:

                    logger.info(
                        f"Processing referral "
                        f"campaign for: "
                        f"{job.title}"
                    )

                    cached_profiles = (
                        await linkedin_repository
                        .get_company_profiles(

                            company=job.company,

                            user_id=user_id
                        )
                    )

                    if cached_profiles:

                        logger.info(
                            f"Using cached LinkedIn "
                            f"profiles for "
                            f"{job.company}"
                        )

                        profiles = []

                        for cached in cached_profiles:

                            profiles.append({

                                "name":
                                cached.name,

                                "linkedin_url":
                                cached.linkedin_url,

                                "current_role":
                                cached.current_role
                            })

                    else:

                        logger.info(
                            f"Fetching LinkedIn profiles "
                            f"from SerpAPI for "
                            f"{job.company}"
                        )

                        profiles = (
                            finder.search_profiles(

                                job.company,

                                limit=20
                            )
                        )

                        await linkedin_repository.save_profiles(

                            company=job.company,

                            profiles=profiles,

                            user_id=user_id
                        )

                    

                    logger.info(
                        f"LinkedIn profiles found: "
                        f"{len(profiles)}"
                    )

                    message = (
                        await generator
                        .generate_message(user_id=user_id,job=job)
                    )

                    payload = {

                        "job_hash": job.job_hash,

                        "company": job.company,

                        "role": job.title,

                        "job_link": job.apply_url,

                        "linkedin_profiles": profiles,

                        "referral_message": message,

                        "status": "no_action",

                        "notes": None
                    }

                    logger.info(
                        f"Saving referral "
                        f"campaign for: "
                        f"{job.title}"
                    )

                    

                    await repository.save_campaign(

                        payload,

                        user_id=user_id
                    )

                    await feed_manager.add_job(

                        user_id=user_id,

                        payload=payload
                    )

                    logger.info(
                        f"Broadcasting websocket "
                        f"payload for: "
                        f"{job.title}"
                    )

                    await broadcast_to_user(

                        user_id,

                        payload
                    )


                    await repository.mark_feed_published(

                        job_hash=job.job_hash,

                        user_id=user_id
                    )

                except Exception as e:

                    logger.error(
                        f"Referral pipeline failed "
                        f"for {job.title}: {e}"
                    )

            logger.info(
                "Referral pipeline completed"
            )
    except Exception as e:
        logger.critical(f"Critical failure in referral pipeline for user {user_id}: {e}")