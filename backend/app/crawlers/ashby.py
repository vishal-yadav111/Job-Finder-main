import httpx
import logging
from app.crawlers.base import CrawlResult

logger = logging.getLogger(__name__)

class AshbyCrawler:
    BASE_URL = "https://jobs.ashbyhq.com/api/non-user-graphql"

    async def fetch_jobs(self, company: str) -> CrawlResult:
        try:
            # Standard browser headers to ensure Cloudflare doesn't drop the packet
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Origin": "https://jobs.ashbyhq.com",
                "Referer": f"https://jobs.ashbyhq.com/{company}",
            }

            # Enhanced GraphQL query covering secondary fields, tiers, and salary if exposed
            payload = {
                "query": """
                query($organizationHostedJobsPageName: String!) {
                  jobBoard{
                    jobPostings(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
                      id
                      title
                      locationName
                      secondaryLocations {
                        locationName
                      }
                      employmentType
                      departmentName
                      teamName
                      publishedAt
                      applyUrl
                      descriptionHtml
                    }
                  }
                }
                """,
                "variables": {
                    "organizationHostedJobsPageName": company
                }
            }

            # Set strict connection limits so a hanging Ashby API doesn't jam your app worker
            timeout = httpx.Timeout(15.0, connect=5.0)

            try:
                async with httpx.AsyncClient(headers=headers, timeout=timeout) as client:
                    response = await client.post(self.BASE_URL, json=payload)
                    
                    # Check for HTTP Layer Failures (4xx / 5xx)
                    if response.status_code != 200:
                        logger.error(f"Ashby API returned status {response.status_code} for company: {company}")
                        return CrawlResult(
                            success=False,
                            jobs=[],
                            error=f"HTTP status error: {response.status_code}"
                        )

                    response_json = response.json()

            # Handle explicit connection dropouts or invalid JSON responses safely
            except httpx.HTTPError as exc:
                logger.exception(f"Network transport level exception for Ashby ({company}): {exc}")
                return CrawlResult(success=False, jobs=[], error=f"Network transport error: {str(exc)}")
            except ValueError:
                logger.error(f"Failed parsing raw string payload into JSON from Ashby ({company})")
                return CrawlResult(success=False, jobs=[], error="Malformed JSON payload response")

            # GraphQL Specific Error Handling (Status code can be 200, but contain internal query errors)
            if "errors" in response_json:
                gql_errors = response_json.get("errors", [])
                logger.error(f"Ashby GraphQL processing error for {company}: {gql_errors}")
                return CrawlResult(
                    success=False,
                    jobs=[],
                    error=f"GraphQL Error: {gql_errors[0].get('message', 'Unknown execution failure')}"
                )

            # Deep data extraction layer
            jobs = (
                response_json.get("data", {})
                .get("jobBoard", {})
                .get("jobPostings", [])
            )

            return CrawlResult(
                success=True,
                jobs=jobs
            )
        except Exception as e:
            # Final safety net to prevent backend crash
            logger.error(f"Unexpected system failure in AshbyCrawler for {company}: {str(e)}")
            return CrawlResult(
                success=False,
                jobs=[],
                error="Internal system failure during crawl"
            )