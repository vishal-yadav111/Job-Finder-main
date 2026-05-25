# utils/retry.py

from tenacity import retry
from tenacity import stop_after_attempt
from tenacity import wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential()
)
async def fetch():
    pass