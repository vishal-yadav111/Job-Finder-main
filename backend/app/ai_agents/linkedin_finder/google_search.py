import os
import logging
from serpapi import GoogleSearch

logger = logging.getLogger(__name__)

class GoogleSearchClient:

    def search(
        self,
        query: str
    ):
        try:
            params = {

                "engine": "google",

                "q": query,

                "api_key": os.getenv(
                    "SERP_API_KEY"
                ),

                "num": 10
            }

            search = GoogleSearch(
                params
            )

            results = (
                search.get_dict()
            )

            return results
        except Exception as e:
            logger.error(f"Google Search API request failed for query '{query}': {e}")
            return {}