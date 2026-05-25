import logging
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from app.auth.dependencies import (
    get_current_user_id
)

from app.ai_agents.orchestration.scheduler_manager import (

    start_scheduler,

    stop_scheduler,

    is_scheduler_running
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan/start")
async def start_scan(

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        running = (
            is_scheduler_running(
                user_id
            )
        )

        if running:

            return {
                "status":
                "already_running"
            }

        await start_scheduler(
            user_id
        )

        return {
            "status": "started",

            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error starting scan for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start scan"
        )


@router.post("/scan/stop")
async def stop_scan(

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        await stop_scheduler(
            user_id
        )

        return {
            "status": "stopped",

            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error stopping scan for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to stop scan"
        )