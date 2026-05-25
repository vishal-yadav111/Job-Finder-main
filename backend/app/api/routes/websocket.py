from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

from jose import jwt
from jose import JWTError

from dotenv import load_dotenv

import os

from app.ai_agents.shared.websocket_manager import (
    connect,
    disconnect
)


load_dotenv()


router = APIRouter()


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY"
)

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)


@router.websocket("/ws/jobs")
async def websocket_jobs(
    websocket: WebSocket
):

    token = websocket.query_params.get(
        "token"
    )

    if not token:

        print(
            "WEBSOCKET ERROR: "
            "Missing token"
        )

        await websocket.close(
            code=4001
        )

        return

    try:

        payload = jwt.decode(

            token,

            JWT_SECRET_KEY,

            algorithms=[JWT_ALGORITHM]
        )

        

        if payload.get(
            "type"
        ) != "access":

            print(
                "WEBSOCKET ERROR: "
                "Invalid token type"
            )

            await websocket.close(
                code=4003
            )

            return

        user_id = int(
            payload["sub"]
        )

    except JWTError as e:

       

        await websocket.close(
            code=4002
        )

        return

    except Exception as e:

        

        await websocket.close(
            code=4004
        )

        return

    try:
        await connect(
            user_id,
            websocket
        )

        try:

            while True:

                await websocket.receive_text()

        except WebSocketDisconnect:

            await disconnect(
                user_id,
                websocket
            )
        except Exception as e:
            # Catch errors during the active connection loop
            print(f"WEBSOCKET LOOP ERROR: {e}")
            await disconnect(user_id, websocket)
            
    except Exception as e:
        # Final safety for connection-level errors
        print(f"WEBSOCKET CRITICAL ERROR: {e}")