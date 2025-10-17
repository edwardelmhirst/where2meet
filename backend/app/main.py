from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api.endpoints import meeting_points_router, health_router
from app.services import TfLService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    logger.info("Shutting down...")
    from app.api.endpoints.meeting_points import tfl_service
    await tfl_service.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health_router,
    prefix="/api/health",
    tags=["health"]
)

app.include_router(
    meeting_points_router,
    prefix="/api/meeting-points",
    tags=["meeting-points"]
)


@app.get("/")
async def root():
    return {
        "message": "Where2Meet API",
        "version": settings.app_version,
        "docs": "/api/docs"
    }