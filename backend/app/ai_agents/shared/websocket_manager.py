from collections import defaultdict
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

active_connections = defaultdict(
    list
)


async def connect(

    user_id: int,

    websocket: WebSocket
):
    try:
        await websocket.accept()

        active_connections[
            user_id
        ].append(websocket)

        print(
            f"WebSocket connected "
            f"for user {user_id}"
        )
    except Exception as e:
        logger.error(f"Error connecting WebSocket for user {user_id}: {e}")


async def disconnect(

    user_id: int,

    websocket: WebSocket
):
    try:
        if user_id in active_connections:

            if websocket in active_connections[
                user_id
            ]:

                active_connections[
                    user_id
                ].remove(websocket)

            if not active_connections[
                user_id
            ]:

                del active_connections[
                    user_id
                ]

        print(
            f"WebSocket disconnected "
            f"for user {user_id}"
        )
    except Exception as e:
        logger.error(f"Error disconnecting WebSocket for user {user_id}: {e}")


async def broadcast_to_user(

    user_id: int,

    payload: dict
):
    try:
        connections = active_connections.get(
            user_id,
            []
        )

        disconnected = []

        for websocket in connections:

            try:

                await websocket.send_json(
                    payload
                )

            except Exception:

                disconnected.append(
                    websocket
                )

        for websocket in disconnected:

            await disconnect(
                user_id,
                websocket
            )
    except Exception as e:
        logger.error(f"Error broadcasting to user {user_id}: {e}")