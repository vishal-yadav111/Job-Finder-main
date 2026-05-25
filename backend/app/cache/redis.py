import os
import logging
from dotenv import load_dotenv

from redis.asyncio import Redis

# Setup basic logger
logger = logging.getLogger(__name__)

load_dotenv()

redis_url = os.getenv("REDIS_URL")



try:
    if redis_url:
        redis_client = Redis.from_url(
            redis_url,
            decode_responses=True
        )
    else:
        logger.error("REDIS_URL is not set in environment variables.")
        redis_client = None
except Exception as e:
    logger.error(f"Failed to initialize Redis client: {e}")
    redis_client = None