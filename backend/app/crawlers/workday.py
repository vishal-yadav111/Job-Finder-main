import httpx
import logging
import asyncio

from app.crawlers.base import (
    CrawlResult
)

from app.crawlers.workday_strategies import (
    WORKDAY_ENDPOINT_PATTERNS
)

logger = logging.getLogger(__name__)


class WorkdayCrawler:

    async def fetch_jobs(
        self,
        base_url: str
    ) -> CrawlResult:

        base_url = base_url.rstrip("/")

        headers = {

            "Accept": "application/json",

            "Content-Type": "application/json",

            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),

            "Origin": base_url,

            "Referer": (
                f"{base_url}/en-US/careers"
            ),
        }

        timeout = httpx.Timeout(
            15.0,
            connect=5.0
        )

        limit = 20

        all_jobs = []

        try:
            async with httpx.AsyncClient(
                headers=headers,
                timeout=timeout
            ) as client:

                working_api_url = None

                # ------------------------------------------------
                # Try multiple Workday endpoint strategies
                # ------------------------------------------------

                for pattern in WORKDAY_ENDPOINT_PATTERNS:

                    test_url = (
                        f"{base_url}{pattern}"
                    )

                    try:

                        response = await client.post(

                            test_url,
                            json={
                                "appliedFacets": {},

                                "limit": 1,

                                "offset": 0,

                                "searchText": ""
                            }
                        )

                        if response.status_code == 200:

                            logger.info(
                                f"Found working "
                                f"Workday endpoint: "
                                f"{test_url}"
                            )

                            working_api_url = (
                                test_url
                            )

                            break

                    except Exception:
                        continue

                # ------------------------------------------------
                # No valid endpoint found
                # ------------------------------------------------

                if not working_api_url:

                    logger.error(
                        f"No valid Workday endpoint "
                        f"found for {base_url}"
                    )

                    return CrawlResult(

                        success=False,

                        jobs=[],

                        error=(
                            "No valid Workday "
                            "endpoint found"
                        )
                    )

                # ------------------------------------------------
                # Pagination Crawl
                # ------------------------------------------------

                offset = 0

                while True:

                    payload = {

                        "appliedFacets": {},

                        "limit": limit,

                        "offset": offset,

                        "searchText": ""
                    }

                    try:

                        response = await client.post(
                            working_api_url,
                            json=payload
                        )

                        if response.status_code != 200:

                            logger.error(
                                f"Workday returned "
                                f"status "
                                f"{response.status_code}"
                            )

                            return CrawlResult(

                                success=False,

                                jobs=all_jobs,

                                error=(
                                    f"HTTP Error "
                                    f"{response.status_code}"
                                )
                            )

                        data = response.json()

                    except httpx.HTTPError as exc:

                        logger.exception(
                            f"Network error "
                            f"while calling "
                            f"Workday: {exc}"
                        )

                        return CrawlResult(

                            success=False,

                            jobs=all_jobs,

                            error=(
                                f"Network exception: "
                                f"{str(exc)}"
                            )
                        )

                    except ValueError:

                        logger.error(
                            f"Invalid JSON response "
                            f"from Workday"
                        )

                        return CrawlResult(

                            success=False,

                            jobs=all_jobs,

                            error="Invalid JSON"
                        )
                    
                    except Exception as e:
                        logger.error(f"Unexpected error during pagination: {e}")
                        break

                    postings = data.get(
                        "jobPostings",
                        []
                    )

                    total_jobs = data.get(
                        "total",
                        0
                    )

                    if not postings:
                        break

                    all_jobs.extend(postings)

                    logger.info(
                        f"Fetched "
                        f"{len(all_jobs)} "
                        f"Workday jobs"
                    )

                    if (
                        offset + limit >= total_jobs
                        or
                        len(all_jobs) >= total_jobs
                    ):
                        break

                    offset += limit

                    await asyncio.sleep(1.0)

                return CrawlResult(

                    success=True,

                    jobs=all_jobs
                )
        except Exception as e:
            logger.error(f"Critical failure in WorkdayCrawler for {base_url}: {e}")
            return CrawlResult(success=False, jobs=all_jobs, error=str(e))