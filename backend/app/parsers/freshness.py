from datetime import datetime, timedelta, timezone


def is_fresh(posted_at):

    if not posted_at:
        return False

    try:
        now = datetime.now(timezone.utc)

        return posted_at >= (
            now - timedelta(hours=24)
        )
    except Exception:
        # Returning False ensures that if date comparison fails, 
        # the job is simply treated as not fresh rather than crashing the system.
        return False