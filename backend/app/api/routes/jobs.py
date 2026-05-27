import logging
from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Depends

from sqlalchemy import select
from sqlalchemy import and_
from sqlalchemy import or_
from sqlalchemy import delete

from app.db.connection import (
    AsyncSessionLocal
)

from app.db.models import (
    ReferralCampaign,
    RawJob,
    JobAIResult,
    LinkedinProfile
)
import uuid
from fastapi import HTTPException, status

from app.auth.dependencies import (
    get_current_user_id
)

from app.cache.feed_manager import (
    feed_manager
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/jobs")
async def get_jobs(

    search: str = "",

    page: int = 1,

    limit: int = 20,

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        async with AsyncSessionLocal() as session:

            query = select(
                ReferralCampaign
            ).where(
                ReferralCampaign.user_id
                == user_id
            )

            if search:

                tokens = (
                    search
                    .lower()
                    .split()
                )

                conditions = []

                for token in tokens:

                    token_condition = or_(

                        ReferralCampaign.company.ilike(
                            f"%{token}%"
                        ),

                        ReferralCampaign.role.ilike(
                            f"%{token}%"
                        ),

                        ReferralCampaign.notes.ilike(
                            f"%{token}%"
                        ),

                        ReferralCampaign.status.ilike(
                            f"%{token}%"
                        ),

                        ReferralCampaign.referral_message.ilike(
                            f"%{token}%"
                        )
                    )

                    conditions.append(
                        token_condition
                    )

                query = query.where(
                    and_(*conditions)
                )

            query = (
                query
                .order_by(
                    ReferralCampaign.created_at.desc()
                )
                .offset(
                    (page - 1) * limit
                )
                .limit(limit)
            )

            result = await session.execute(
                query
            )

            rows = result.scalars().all()

            response = []

            for row in rows:

                
                linkedin_query = (
                    select(LinkedinProfile)
                    .where(
                        LinkedinProfile.company
                        == row.company
                    )
                )

                linkedin_result = (
                    await session.execute(
                        linkedin_query
                    )
                )

                linkedin_rows = (
                    linkedin_result
                    .scalars()
                    .all()
                )

                linkedin_profiles = []

                for linkedin_row in linkedin_rows:

                    linkedin_profiles.append({

                        "name":
                        linkedin_row.name,

                        "linkedin_url":
                        linkedin_row.linkedin_url,

                        "current_role":
                        linkedin_row.current_role
                    })
                response.append({

                    "job_hash": row.job_hash,

                    "company": row.company,

                    "role": row.role,

                    "job_link": row.job_link,

                    "linkedin_profiles": linkedin_profiles,

                    "referral_message": (
                        row.referral_message
                    ),

                    "status": row.status,

                    "notes": row.notes,

                    "created_at": str(
                        row.created_at
                    )
                })

            return response
    except Exception as e:
        logger.error(f"Error in get_jobs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/jobs/{job_hash}")
async def update_job(

    job_hash: str,

    payload: dict,

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        async with AsyncSessionLocal() as session:

            query = select(
                ReferralCampaign
            ).where(

                ReferralCampaign.job_hash
                == job_hash,

                ReferralCampaign.user_id
                == user_id
            )

            result = await session.execute(
                query
            )

            job = result.scalar_one_or_none()

            if not job:

                raise HTTPException(
                    status_code=404,
                    detail="Job not found"
                )

            new_status = payload.get(
                "status"
            )

            new_notes = payload.get(
                "notes"
            )

            if new_status:

                job.status = new_status

            if new_notes is not None:

                job.notes = new_notes

            if new_status == "closed":

                await session.execute(
                    delete(ReferralCampaign).where(
                        ReferralCampaign.job_hash == job_hash
                    )
                )

                await session.execute(
                    delete(JobAIResult).where(
                        JobAIResult.job_hash == job_hash
                    )
                )

                await session.execute(
                    delete(RawJob).where(
                        RawJob.job_hash == job_hash
                    )
                )

            await session.commit()

            try:
                await feed_manager.update_feed_item(
                    user_id=user_id,
                    job_hash=job_hash,
                    updates={
                        "status": new_status,
                        "notes": new_notes
                    }
                )
            except Exception as e:
                logger.error(f"Failed to update feed cache: {e}")

            return {
                "success": True,
                "job_hash": job_hash,
                "status": new_status
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_job: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    



@router.post("/jobs")
async def create_job(

    payload: dict,

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        company = payload.get("company")
        role = payload.get("role")

        if not company or not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="company and role are required")

        job_hash = str(uuid.uuid4())

        recruiter_name = payload.get("recruiter_name")
        job_link = payload.get("job_link")
        linkedin_profiles = payload.get("linkedin_profiles") or []
        referral_message = payload.get("referral_message") or ""
        status_field = payload.get("status") or "generated_applied"
        notes = payload.get("notes")

        metadata_notes = []
        if recruiter_name:
            metadata_notes.append(f"Recruiter: {recruiter_name}")

        platform_applied = payload.get("platform_applied") or payload.get("applied_via")
        if platform_applied:
            metadata_notes.append(f"Applied via: {platform_applied}")

        message_badge = payload.get("message_badge")
        if message_badge:
            metadata_notes.append(f"Message type: {message_badge}")

        if metadata_notes:
            notes = "\n".join([note for note in [notes, *metadata_notes] if note]) or None

        async with AsyncSessionLocal() as session:
            campaign = ReferralCampaign(
                user_id=user_id,
                job_hash=job_hash,
                company=company,
                role=role,
                job_link=job_link or "",
                linkedin_profiles=linkedin_profiles,
                referral_message=referral_message,
                status=status_field,
                notes=notes,
            )

            session.add(campaign)
            await session.commit()

            return {
                "success": True,
                "job_hash": job_hash,
                "company": company,
                "role": role,
                "status": status_field
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_job: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/jobs/{job_hash}")
async def delete_job(

    job_hash: str,

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        async with AsyncSessionLocal() as session:
            query = select(ReferralCampaign).where(
                ReferralCampaign.job_hash == job_hash,
                ReferralCampaign.user_id == user_id
            )

            result = await session.execute(query)
            job = result.scalar_one_or_none()

            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

            await session.execute(
                delete(ReferralCampaign).where(
                    ReferralCampaign.job_hash == job_hash,
                    ReferralCampaign.user_id == user_id,
                )
            )
            await session.execute(
                delete(JobAIResult).where(
                    JobAIResult.job_hash == job_hash,
                    JobAIResult.user_id == user_id,
                )
            )
            await session.execute(
                delete(RawJob).where(
                    RawJob.job_hash == job_hash,
                    RawJob.user_id == user_id,
                )
            )

            await session.commit()

            try:
                await feed_manager.remove_feed_item(user_id=user_id, job_hash=job_hash)
            except Exception as e:
                logger.error(f"Failed to remove feed cache item: {e}")

            return {"success": True, "job_hash": job_hash}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_job: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    




@router.get("/jobs/feed")
async def get_feed(

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        feed = await feed_manager.get_feed(
            user_id=user_id
        )

        if not feed:
            return {

                "items": []
            }

        job_hashes = [
            item.get("job_hash")
            for item in feed
            if isinstance(item, dict) and item.get("job_hash")
        ]

        campaign_lookup = {}

        if job_hashes:
            async with AsyncSessionLocal() as session:
                query = select(ReferralCampaign).where(
                    ReferralCampaign.user_id == user_id,
                    ReferralCampaign.job_hash.in_(job_hashes)
                )

                result = await session.execute(query)
                campaigns = result.scalars().all()
                campaign_lookup = {
                    campaign.job_hash: campaign
                    for campaign in campaigns
                }

        normalized_feed = []

        for item in feed:
            if not isinstance(item, dict):
                continue

            campaign = campaign_lookup.get(item.get("job_hash"))

            normalized_feed.append({
                **item,
                "company": item.get("company") or (campaign.company if campaign else None) or "Unknown Company",
                "role": item.get("role") or (campaign.role if campaign else None) or "Unknown Role",
                "job_link": item.get("job_link") or (campaign.job_link if campaign else None),
                "linkedin_profiles": item.get("linkedin_profiles") or (campaign.linkedin_profiles if campaign else []),
                "referral_message": item.get("referral_message") or (campaign.referral_message if campaign else ""),
                "status": item.get("status") or (campaign.status if campaign else "no_action"),
                "notes": item.get("notes") or (campaign.notes if campaign else None),
                "created_at": item.get("created_at") or (str(campaign.created_at) if campaign and campaign.created_at else None),
            })

        return {

            "items": normalized_feed
        }
    except Exception as e:
        logger.error(f"Error in get_feed: {e}")
        return {"items": []}