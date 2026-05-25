import logging
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from app.auth.dependencies import (
    get_current_user_id
)

from app.scheduler.manager import (
    scheduler_manager
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/scan/status")
async def scan_status(

    user_id: int = Depends(
        get_current_user_id
    )
):
    try:
        running = (
            scheduler_manager
            .is_running(user_id)
        )

        return {

            "running": running
        }
    except Exception as e:
        logger.error(f"Error checking scan status for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve scan status"
        )