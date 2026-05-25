import httpx
import logging
from app.crawlers.base import CrawlResult

logger = logging.getLogger(__name__)

class LeverCrawler:
    BASE_URL = "https://api.lever.co/v0/postings"

    async def fetch_jobs(self, company: str) -> CrawlResult:
        try:
            # Clean up corporate slug spacing string issues
            company = company.strip()
            url = f"{self.BASE_URL}/{company}"
            
            # ?mode=json explicitly instructs Lever's CDN to stream full-text data objects
            params = {"mode": "json"}

            # Basic web browser identity spoof to safely sail past routing filters
            headers = {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }

            # Set a 20-second timeout. Large enterprise tech stacks on Lever can return 
            # hundreds of active postings in one massive array, slowing down response times.
            timeout = httpx.Timeout(20.0, connect=5.0)

            try:
                async with httpx.AsyncClient(headers=headers, timeout=timeout) as client:
                    response = await client.get(url, params=params)

                    if response.status_code == 404:
                        logger.warning(f"Lever career board not found or set to private for slug: {company}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error="Company board not found or currently inactive"
                        )

                    if response.status_code != 200:
                        logger.error(f"Lever API returned an unexpected status {response.status_code} for: {company}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error=f"HTTP unexpected status: {response.status_code}"
                        )

                    # Lever streams an array of objects directly at the root JSON level
                    jobs = response.json()
                    
                    if not isinstance(jobs, list):
                        logger.error(f"Expected a list of jobs from Lever, got {type(jobs)} instead for {company}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error="Malformed response structure: Expected root-level JSON array"
                        )

                    return CrawlResult(
                        success=True,
                        jobs=jobs
                    )

            # Catch distinct connection and gateway transport drops
            except httpx.HTTPError as exc:
                logger.exception(f"Network transport breakdown while contacting Lever API ({company}): {exc}")
                return CrawlResult(
                    success=False,
                    jobs=[],
                    error=f"Network infrastructure error: {str(exc)}"
                )
            # Catch JSON corruption or structural failures safely
            except (ValueError, TypeError) as parse_err:
                logger.error(f"Failed parsing raw payload from Lever into target array layout: {parse_err}")
                return CrawlResult(
                    success=False,
                    jobs=[],
                    error="Failed parsing API response content schema"
                )
        except Exception as e:
            # Final safety net to prevent backend crash
            logger.error(f"Unexpected failure in LeverCrawler: {str(e)}")
            return CrawlResult(
                success=False,
                jobs=[],
                error="Internal system failure during crawl"
            )