from apscheduler.schedulers.asyncio import (
    AsyncIOScheduler
)

from app.main import main

# Define a wrapper to catch exceptions within the scheduled job
async def safe_main():
    try:
        await main()
    except Exception as e:
        # Logging the error prevents the exception from propagating to the scheduler
        print(f"Error in scheduled job: {e}")

scheduler = AsyncIOScheduler()

# Use the safe wrapper instead of the direct function
scheduler.add_job(
    safe_main,
    "interval",
    hours=3
)


def start_scheduler():

    scheduler.start()