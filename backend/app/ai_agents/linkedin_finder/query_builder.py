import logging

logger = logging.getLogger(__name__)

class LinkedinQueryBuilder:

    @staticmethod
    def build_queries(
        company: str
    ):
        try:
            company = (
                company
                .strip()
            )

            return [

                f'site:linkedin.com/in "{company}" "Software Engineer" India'
            ]
        except Exception as e:
            logger.error(f"Error building LinkedIn queries: {e}")
            return []