import asyncio

from app.main import (
    main
)

from app.utils.logger import (
    logger
)


async def scheduler_loop(
    user_id: int
):

    logger.info(
        f"Scheduler loop started "
        f"for user {user_id}"
    )

    while True:

        try:

            logger.info(
                f"Starting scheduled "
                f"crawl cycle for user "
                f"{user_id}"
            )

            await main(
                user_id=user_id
            )

            logger.info(
                f"Scheduled cycle "
                f"completed for user "
                f"{user_id}"
            )

        except Exception as e:

            logger.error(
                f"Scheduler failed "
                f"for user {user_id}: "
                f"{e}"
            )

        try:
            await asyncio.sleep(
                60 * 60 * 3
            )
        except Exception as e:
            logger.error(
                f"Sleep interrupted in scheduler loop "
                f"for user {user_id}: {e}"
            )