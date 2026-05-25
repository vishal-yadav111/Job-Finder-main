from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.websocket import (
    router as ws_router
)

from app.api.routes.crawler import (
    router as crawler_router
)

from app.api.routes.jobs import (
    router as jobs_router
)

from app.auth.routes import (
    router as auth_router
)

from app.api.routes.websocket import (
    router as websocket_router
)

from app.api.routes.scan import (
    router as scan_router
)

app = FastAPI()

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)

app.include_router(ws_router)

app.include_router(crawler_router)

app.include_router(jobs_router)

app.include_router(auth_router)

app.include_router(
    websocket_router
)


app.include_router(
    scan_router
)