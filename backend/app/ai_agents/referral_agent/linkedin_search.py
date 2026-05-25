import logging
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class LinkedinProfileFinder:

    def search_profiles(
        self,
        company,
        limit=20
    ):
        try:
            query = (
                f'site:linkedin.com/in '
                f'"{company}" '
                f'"Software Engineer"'
            )

            google_url = (
                "https://www.google.com/search"
                f"?q={query}"
            )

            headers = {
                "User-Agent": (
                    "Mozilla/5.0"
                )
            }

            response = requests.get(
                google_url,
                headers=headers,
                timeout=20
            )
            
            # Raise exception for bad HTTP status codes
            response.raise_for_status()

            soup = BeautifulSoup(
                response.text,
                "html.parser"
            )

            profiles = []

            for link in soup.find_all("a"):

                href = link.get("href", "")

                if "linkedin.com/in/" in href:

                    cleaned = (
                        href
                        .split("&")[0]
                        .replace("/url?q=", "")
                    )

                    if cleaned not in profiles:
                        profiles.append(cleaned)

                if len(profiles) >= limit:
                    break

            return profiles
        except requests.RequestException as e:
            logger.error(f"Network error during LinkedIn profile search for {company}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during LinkedIn search for {company}: {e}")
            return []