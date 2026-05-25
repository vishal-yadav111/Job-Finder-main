import logging

from app.ai_agents.linkedin_finder.query_builder import (
    LinkedinQueryBuilder
)

from app.ai_agents.linkedin_finder.google_search import (
    GoogleSearchClient
)

from app.ai_agents.linkedin_finder.html_parser import (
    LinkedinHTMLParser
)

logger = logging.getLogger(__name__)

class LinkedinProfileFinder:

    def __init__(self):

        self.query_builder = (
            LinkedinQueryBuilder()
        )

        self.google_client = (
            GoogleSearchClient()
        )

        self.parser = (
            LinkedinHTMLParser()
        )


    def search_profiles(
        self,
        company: str,
        limit: int = 20
    ):
        try:
            queries = (
                self.query_builder
                .build_queries(company)
            )

            all_profiles = []

            seen_urls = set()

            for query in queries:

                try:

                    html = (
                        self.google_client
                        .search(query)
                    )

                    profiles = (
                        self.parser
                        .parse(html)
                    )

                    for profile in profiles:

                        url = profile[
                            "linkedin_url"
                        ]

                        if url in seen_urls:
                            continue

                        seen_urls.add(url)
                        

                        all_profiles.append(
                            profile
                        )

                        if (
                            len(all_profiles)
                            >= limit
                        ):

                            return all_profiles

                except Exception as e:

                    print(
                        f"LinkedIn search failed: {e}"
                    )

            return all_profiles
        except Exception as e:
            logger.error(f"Critical failure in search_profiles for company {company}: {e}")
            return []