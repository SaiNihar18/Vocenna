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
origins = []
if settings.CORS_ORIGINS:
    if isinstance(settings.CORS_ORIGINS, str):
        try:
            import json
            origins = json.loads(settings.CORS_ORIGINS)
        except Exception:
            origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    else:
        origins = [str(o) for o in settings.CORS_ORIGINS]

# Force allow production Vercel origins to guarantee CORS success
prod_domains = ["https://vocenna-ecru.vercel.app", "https://vocenna.vercel.app"]
for domain in prod_domains:
    if domain not in origins:
        origins.append(domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
