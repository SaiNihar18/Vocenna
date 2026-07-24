from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.db import init_db_pgvector
from app.api.v1.router import api_router
from app.websocket.handler import router as websocket_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print(f"Starting {settings.PROJECT_NAME} backend in {settings.ENVIRONMENT} mode...")
    try:
        await init_db_pgvector()
        print("pgvector extension verified/enabled.")
    except Exception as e:
        print(f"Warning: Could not initialize pgvector extension on startup: {e}")
    yield
    # Shutdown actions
    print(f"Shutting down {settings.PROJECT_NAME} backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Voice Collaboration Platform API",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router)



@app.get("/health", tags=["Health"])
async def root_health():
    """Top-level health check endpoint for container probes."""
    return {"status": "ok", "message": f"Welcome to {settings.PROJECT_NAME} API"}
