import uuid
import logging
from datetime import datetime
from datetime import timedelta

from sqlalchemy import select

from app.db.models import (
    User,
    RefreshSession
)

from app.auth.hashing import (
    hash_password,
    verify_password
)

from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS
)

logger = logging.getLogger(__name__)

class AuthService:

    def __init__(
        self,
        session
    ):

        self.session = session


    async def register(

        self,

        email: str,

        password: str
    ):
        try:
            existing_user = (
                await self.session.execute(

                    select(User).where(
                        User.email == email
                    )
                )
            )

            existing_user = (
                existing_user
                .scalar_one_or_none()
            )

            if existing_user:

                raise Exception(
                    "User already exists"
                )

            user = User(

                email=email,

                hashed_password=
                hash_password(password)
            )

            self.session.add(user)

            await self.session.commit()

            await self.session.refresh(user)

            return user
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Registration failed: {e}")
            raise


    async def login(

        self,

        email: str,

        password: str
    ):
        try:
            result = await self.session.execute(

                select(User).where(
                    User.email == email
                )
            )

            user = (
                result.scalar_one_or_none()
            )

            if not user:

                raise Exception(
                    "Invalid credentials"
                )

            valid_password = (
                verify_password(

                    password,

                    user.hashed_password
                )
            )

            if not valid_password:

                raise Exception(
                    "Invalid credentials"
                )

            session_id = str(
                uuid.uuid4()
            )

            access_token = (
                create_access_token(
                    user.id
                )
            )

            refresh_token = (
                create_refresh_token(
                    session_id
                )
            )

            refresh_session = (
                RefreshSession(

                    session_id=session_id,

                    user_id=user.id,

                    refresh_token_hash=
                    hash_password(
                        refresh_token
                    ),

                    expires_at=
                    datetime.utcnow()
                    + timedelta(
                        days=
                        REFRESH_TOKEN_EXPIRE_DAYS
                    )
                )
            )

            self.session.add(
                refresh_session
            )

            await self.session.commit()

            return {

                "access_token":
                access_token,

                "refresh_token":
                refresh_token
            }
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Login failed: {e}")
            raise


    async def refresh_tokens(

        self,

        refresh_token: str
    ):
        try:
            from jose import jwt

            from app.auth.jwt import (

                SECRET_KEY,

                ALGORITHM
            )

            payload = jwt.decode(

                refresh_token,

                SECRET_KEY,

                algorithms=[ALGORITHM]
            )

            if payload.get(
                "type"
            ) != "refresh":

                raise Exception(
                    "Invalid token type"
                )

            session_id = payload.get(
                "sub"
            )

            result = await self.session.execute(

                select(RefreshSession).where(

                    RefreshSession.session_id
                    == session_id
                )
            )

            refresh_session = (
                result.scalar_one_or_none()
            )

            if not refresh_session:

                raise Exception(
                    "Session not found"
                )

            if refresh_session.revoked:

                raise Exception(
                    "Refresh token revoked"
                )

            valid = verify_password(

                refresh_token,

                refresh_session
                .refresh_token_hash
            )

            if not valid:

                raise Exception(
                    "Invalid refresh token"
                )

            if (
                refresh_session.expires_at
                < datetime.utcnow()
            ):

                raise Exception(
                    "Refresh token expired"
                )

            # REVOKE OLD TOKEN

            refresh_session.revoked = True

            # CREATE NEW SESSION

            new_session_id = str(
                uuid.uuid4()
            )

            new_refresh_token = (
                create_refresh_token(
                    new_session_id
                )
            )

            new_session = RefreshSession(

                session_id=new_session_id,

                user_id=refresh_session.user_id,

                refresh_token_hash=
                hash_password(
                    new_refresh_token
                ),

                expires_at=
                datetime.utcnow()
                + timedelta(
                    days=
                    REFRESH_TOKEN_EXPIRE_DAYS
                )
            )

            self.session.add(
                new_session
            )

            await self.session.commit()

            new_access_token = (
                create_access_token(
                    refresh_session.user_id
                )
            )

            return {

                "access_token":
                new_access_token,

                "refresh_token":
                new_refresh_token
            }
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Token refresh failed: {e}")
            raise