import asyncio
import logging
from app.ai_agents.shared.llm_client import client
from app.ai_agents.job_filtering.prompt import SYSTEM_PROMPT
from app.ai_agents.job_filtering.parser import parse_llm_response

logger = logging.getLogger("job_filtering.agent")

class JobFilteringAgent:
    async def classify_job(self, raw_job) -> dict | None:
        """
        Submits job context to the LLM endpoint using run_in_executor 
        to ensure the synchronous client call does not block the async loop.
        """
        try:
            description = (raw_job.raw_description or "")[:1500]

            title_lower = (
                raw_job.title or ""
            ).lower()

            # description_lower = (
            #     raw_job.raw_description or ""
            # ).lower()

            senior_keywords = [
                "senior",
                "staff",
                "lead",
                "principal",
                "manager",
                "architect"
            ]

            if any(
                keyword in title_lower
                for keyword in senior_keywords
            ):

                return {
                    "is_fresher": False,
                    "experience_years": 3,
                    "role_category": "backend",
                    "is_india_eligible": True,
                    "salary_detected": False,
                    "salary_lpa": None,
                    "confidence": 0.99
                }

           
            user_prompt = (
                f"Company: {raw_job.company}\n"
                f"Title: {raw_job.title}\n"
                f"Location: {raw_job.location}\n"
                f"Description:\n{description}\n"
            )

            # Safeguard the loop by executing the synchronous API call in an executor thread
            loop = asyncio.get_running_loop()
            
            # Note: Ensure client has default timeouts set, or add extra request configurations
            logger.info(
                f"Sending job to LLM: "
                f"{raw_job.title}"
            )
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: client.chat.completions.create(
                        model="openai/gpt-oss-20b",
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.1 # Enforce deterministic outputs
                    )
                )

                content = response.choices[0].message.content if response.choices else None
                if not content:
                    return None

                logger.info(
                    f"LLM response received for: "
                    f"{raw_job.title}"
                )

                return parse_llm_response(content)
            except Exception as api_e:
                logger.error(f"External LLM API call failed for job {raw_job.title}: {api_e}")
                return None

        except Exception as e:
            logger.error(f"LLM API invocation failed completely for job {getattr(raw_job, 'id', 'unknown')}: {e}")
            return None