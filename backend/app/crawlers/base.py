from dataclasses import dataclass


@dataclass
class CrawlResult:

    success: bool

    jobs: list

    error: str | None = None