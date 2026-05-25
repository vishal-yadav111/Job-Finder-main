import os
import logging
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from jose import jwt

logger = logging.getLogger(__name__)

# Fallback defaults to prevent immediate crash if env vars are missing
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key-please-change")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
except (ValueError, TypeError):
    ACCESS_TOKEN_EXPIRE_MINUTES = 15

try:
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))
except (ValueError, TypeError):
    REFRESH_TOKEN_EXPIRE_DAYS = 30


def create_access_token(
    user_id: int
):
    try:
        expire = (

            datetime.now(
                timezone.utc
            )

            + timedelta(
                minutes=
                ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

        payload = {

            "sub": str(user_id),

            "type": "access",

            "exp": expire
        }

        return jwt.encode(

            payload,

            SECRET_KEY,

            algorithm=ALGORITHM
        )
    except Exception as e:
        logger.error(f"Failed to create access token: {e}")
        return ""


def create_refresh_token(
    session_id: str
):
    try:
        expire = (

            datetime.now(
                timezone.utc
            )

            + timedelta(
                days=
                REFRESH_TOKEN_EXPIRE_DAYS
            )
        )

        payload = {

            "sub": session_id,

            "type": "refresh",

            "exp": expire
        }

        return jwt.encode(

            payload,

            SECRET_KEY,

            algorithm=ALGORITHM
        )
    except Exception as e:
        logger.error(f"Failed to create refresh token: {e}")
        return ""