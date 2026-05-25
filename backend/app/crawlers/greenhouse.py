import httpx
import logging
from app.crawlers.base import CrawlResult

logger = logging.getLogger(__name__)

class GreenhouseCrawler:
    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch_jobs(self, company_token: str) -> CrawlResult:
        try:
            # Clean up the token just in case there are spacing anomalies
            company_token = company_token.strip()
            
            # ?content=true forces Greenhouse to inject full HTML descriptions, offices, and departments
            url = f"{self.BASE_URL}/{company_token}/jobs"
            params = {"content": "true"}

            headers = {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }

            # Set a solid connection and read timeout frame
            timeout = httpx.Timeout(20.0, connect=5.0)

            try:
                async with httpx.AsyncClient(headers=headers, timeout=timeout) as client:
                    response = await client.get(url, params=params)

                    if response.status_code == 404:
                        logger.warning(f"Greenhouse board not found or private for token: {company_token}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error="Company board not found or currently inactive"
                        )

                    if response.status_code != 200:
                        logger.error(f"Greenhouse API returned code {response.status_code} for token: {company_token}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error=f"HTTP unexpected status: {response.status_code}"
                        )

                    data = response.json()
                    jobs = data.get("jobs", [])

                    return CrawlResult(
                        success=True,
                        jobs=jobs
                    )

            # Catch distinct transport layer problems rather than blanket swallowing code exceptions
            except httpx.HTTPError as exc:
                logger.exception(f"Network connectivity breakdown for Greenhouse token ({company_token}): {exc}")
                return CrawlResult(
                    success=False,
                    jobs=[],
                    error=f"Network infrastructure error: {str(exc)}"
                )
            except (ValueError, KeyError) as parse_err:
                logger.error(f"Greenhouse payload schema corruption or invalid JSON formatting: {parse_err}")
                return CrawlResult(
                    success=False,
                    jobs=[],
                    error="Failed parsing API response content schema"
                )
        except Exception as e:
            # Final safety net to prevent backend crash
            logger.error(f"Unexpected system failure in GreenhouseCrawler: {str(e)}")
            return CrawlResult(
                success=False,
                jobs=[],
                error="Internal system failure during crawl"
            )