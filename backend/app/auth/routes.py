import logging
from fastapi import APIRouter
from fastapi import HTTPException

from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest
)

from app.auth.service import (
    AuthService
)

from app.db.connection import (
    AsyncSessionLocal
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register")
async def register(
    payload: RegisterRequest
):

    async with AsyncSessionLocal() as session:

        try:

            service = AuthService(
                session
            )

            user = await service.register(

                email=payload.email,

                password=payload.password
            )

            return {

                "id": user.id,

                "email": user.email
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration route error: {str(e)}")
            raise HTTPException(

                status_code=400,

                detail=str(e)
            )


@router.post("/login")
async def login(
    payload: LoginRequest
):

    async with AsyncSessionLocal() as session:

        try:

            service = AuthService(
                session
            )

            tokens = await service.login(

                email=payload.email,

                password=payload.password
            )

            return tokens

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login route error: {str(e)}")
            raise HTTPException(

                status_code=401,

                detail=str(e)
            )


@router.post("/refresh")
async def refresh_token(
    payload: RefreshRequest
):

    async with AsyncSessionLocal() as session:

        try:

            service = AuthService(
                session
            )

            tokens = (
                await service
                .refresh_tokens(
                    payload.refresh_token
                )
            )

            return tokens

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Refresh route error: {str(e)}")
            raise HTTPException(

                status_code=401,

                detail=str(e)
            )