import logging

logger = logging.getLogger(__name__)

class LinkedinHTMLParser:

    def parse(
        self,
        results: dict
    ):
        try:
            profiles = []

            # Ensure results is a dictionary before access
            if not isinstance(results, dict):
                return []

            organic_results = (
                results.get(
                    "organic_results",
                    []
                )
            )
            
            # Ensure organic_results is iterable
            if not isinstance(organic_results, list):
                return []

            for item in organic_results:

                # Ensure item is a dictionary before access
                if not isinstance(item, dict):
                    continue

                link = item.get(
                    "link"
                )

                title = item.get(
                    "title",
                    ""
                )

                if not link:
                    continue

                if (
                    "linkedin.com/in/"
                    not in link
                ):
                    continue

                profiles.append({

                    "name": title,

                    "linkedin_url": link,

                    "current_role": None
                })

            return profiles
        except Exception as e:
            logger.error(f"Error parsing LinkedIn HTML results: {e}")
            return []