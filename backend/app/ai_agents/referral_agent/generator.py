import os
import asyncio
import logging

from sqlalchemy import select

from app.ai_agents.shared.llm_client import client

from app.ai_agents.referral_agent.prompt import (
    REFERRAL_PROMPT
)

from app.db.connection import (
    AsyncSessionLocal
)

from app.db.models import (
    RawJob
)

logger = logging.getLogger(__name__)


class ReferralMessageGenerator:

    async def get_raw_description(

        self,

        user_id: int,

        job_hash: str
    ):
        try:
            async with AsyncSessionLocal() as session:

                query = (
                    select(RawJob)
                    .where(

                        RawJob.job_hash
                        == job_hash,

                        RawJob.user_id
                        == user_id
                    )
                )

                result = await session.execute(
                    query
                )

                raw_job = (
                    result.scalar_one_or_none()
                )

                if not raw_job:
                    return ""

                return (
                    raw_job.raw_description
                    or ""
                )
        except Exception as e:
            logger.error(f"Error fetching raw description: {e}")
            return ""


    async def generate_message(
        self,
        user_id: int,
        job
    ):
        try:
            raw_description = (
                await self.get_raw_description(

                    user_id=user_id,

                    job_hash=job.job_hash
                )
            )
            profile_summary = os.getenv("PROFILE_SUMMARY", "")
            full_name = os.getenv("FULL_NAME", "")
            grad_year = os.getenv("GRAD_YEAR", "")
            degree = os.getenv("DEGREE", "")
            email = os.getenv("EMAIL", "")
            phone = os.getenv("PHONE", "")
            resume_link = os.getenv("RESUME", "")
            portfolio_link = os.getenv("PORTFOLIO", "")

            user_prompt = f"""
Candidate Name: {full_name}

Graduation Year: {grad_year}

Degree: {degree}

Candidate Summary: {profile_summary}

IMPORTANT:
- Use ONLY this summary for experience
- DO NOT assume experience at the target company
- Extract and use ALL relevant technical skills

Company: {job.company}

Role: {job.title}

Job Description:
{raw_description[:2000]}
"""

            loop = asyncio.get_running_loop()

            response = await loop.run_in_executor(

                None,

                lambda: client.chat.completions.create(

                    model="llama-3.3-70b-versatile",

                    messages=[
                        {
                            "role": "system",
                            "content": REFERRAL_PROMPT
                        },
                        {
                            "role": "user",
                            "content": user_prompt
                        }
                    ],

                    temperature=0.2
                )
            )

            generated_text = (
                response
                .choices[0]
                .message
                .content
                .strip()
            )

            final_message = f"""
Hi,

{generated_text}

I have added the necessary details below.

Job Link: {job.apply_url}
Email: {email}
Portfolio: {portfolio_link}
Resume: {resume_link}
Contact: {phone}

Thank You for your time and consideration.

Best Regards,
{full_name}
"""

            return final_message.strip()
        except Exception as e:
            logger.error(f"Error generating referral message: {e}")
            return "Could not generate referral message at this time."