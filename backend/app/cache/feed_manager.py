import json
import time
import logging

from app.cache.redis import (
    redis_client
)

logger = logging.getLogger(__name__)

FEED_TTL_SECONDS = (
    60 * 60 * 24 * 3
)


class FeedManager:

    async def add_job(

        self,

        user_id: int,

        payload: dict
    ):
        try:
            if not redis_client:
                return

            key = (
                f"feed:user:{user_id}"
            )

            score = time.time()

            serialized = json.dumps(
                payload
            )

            await redis_client.zadd(

                key,

                {
                    serialized: score
                }
            )

            await redis_client.expire(

                key,

                FEED_TTL_SECONDS
            )
        except Exception as e:
            logger.error(f"FeedManager.add_job error: {e}")


    async def get_feed(

        self,

        user_id: int,

        limit: int = 100
    ):
        try:
            if not redis_client:
                return []

            key = (
                f"feed:user:{user_id}"
            )

            results = await redis_client.zrevrange(

                key,

                0,

                limit - 1
            )

            return [

                json.loads(item)

                for item in results
            ]
        except Exception as e:
            logger.error(f"FeedManager.get_feed error: {e}")
            return []
    
    async def update_feed_item(

        self,

        user_id: int,

        job_hash: str,

        updates: dict
    ):
        try:
            if not redis_client:
                return False

            key = (
                f"feed:user:{user_id}"
            )

            results = await redis_client.zrange(
                key,
                0,
                -1
            )

            for item in results:

                try:
                    payload = json.loads(item)
                except json.JSONDecodeError:
                    continue

                if (
                    payload.get("job_hash")
                    != job_hash
                ):
                    continue

                old_score = await redis_client.zscore(
                    key,
                    item
                )

                payload.update({

                    k: v

                    for k, v in updates.items()

                    if v is not None
                })

                updated_item = json.dumps(
                    payload
                )

                pipe = redis_client.pipeline()

                pipe.zrem(
                    key,
                    item
                )

                pipe.zadd(
                    key,
                    {
                        updated_item:
                        old_score
                    }
                )

                await pipe.execute()

                return True

            return False
        except Exception as e:
            logger.error(f"FeedManager.update_feed_item error: {e}")
            return False


feed_manager = FeedManager()