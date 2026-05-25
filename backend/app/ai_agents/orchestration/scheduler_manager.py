import asyncio
import logging

from app.main import main

logger = logging.getLogger(
    "scheduler_manager"
)

active_schedulers = {}


async def scheduler_loop(
    user_id: int
):

    logger.info(
        f"Scheduler loop started "
        f"for user {user_id}"
    )

    while active_schedulers.get(user_id, {}).get("running"):

        try:

            logger.info(
                f"Starting scheduled "
                f"crawl cycle for "
                f"user {user_id}"
            )

            await main(
                user_id=user_id
            )

            logger.info(
                f"Scheduled cycle "
                f"completed for "
                f"user {user_id}"
            )

        except Exception as e:

            logger.error(
                f"Scheduler failed "
                f"for user "
                f"{user_id}: {e}"
            )

        try:
            await asyncio.sleep(
                60 * 60 * 3
            )
        except asyncio.CancelledError:
            logger.info(f"Scheduler loop cancelled for user {user_id}")
            break


async def start_scheduler(
    user_id: int
):
    try:
        existing = (
            active_schedulers.get(
                user_id
            )
        )

        if existing and existing[
            "running"
        ]:

            return False

        task = asyncio.create_task(

            scheduler_loop(user_id)
        )

        active_schedulers[user_id] = {

            "task": task,

            "running": True
        }

        logger.info(
            f"Scheduler started "
            f"for user {user_id}"
        )

        return True
    except Exception as e:
        logger.error(f"Failed to start scheduler for user {user_id}: {e}")
        return False


async def stop_scheduler(
    user_id: int
):
    try:
        scheduler = (
            active_schedulers.get(
                user_id
            )
        )

        if not scheduler:

            return

        scheduler["running"] = False

        scheduler["task"].cancel()

        del active_schedulers[user_id]

        logger.info(
            f"Scheduler stopped "
            f"for user {user_id}"
        )
    except Exception as e:
        logger.error(f"Error stopping scheduler for user {user_id}: {e}")


def is_scheduler_running(
    user_id: int
):
    try:
        scheduler = (
            active_schedulers.get(
                user_id
            )
        )

        return (

            scheduler is not None

            and

            scheduler.get("running", False)
        )
    except Exception:
        return False