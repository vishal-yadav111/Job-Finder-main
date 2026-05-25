import logging
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import (
    HTTPBearer
)
from fastapi.security import (
    HTTPAuthorizationCredentials
)

from jose import jwt
from jose import JWTError

from app.auth.jwt import (
    SECRET_KEY,
    ALGORITHM
)

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user_id(

    credentials:
    HTTPAuthorizationCredentials
    = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(

            token,

            SECRET_KEY,

            algorithms=[ALGORITHM]
        )

        if payload.get(
            "type"
        ) != "access":

            raise HTTPException(

                status_code=401,

                detail="Invalid token type"
            )

        user_id = payload.get(
            "sub"
        )

        if not user_id:

            raise HTTPException(

                status_code=401,

                detail="Invalid token"
            )

        return int(user_id)

    except JWTError:

        raise HTTPException(

            status_code=401,

            detail="Invalid token"
        )
    except Exception as e:
        logger.error(f"Unexpected error in auth dependency: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )