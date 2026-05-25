from datetime import datetime


def parse_datetime(value):

    if not value:
        return None

    if isinstance(value, datetime):
        return value

    try:

        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    except Exception:

        return None