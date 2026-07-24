from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from app.core.redis import check_redis_health
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health Check Endpoint")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Check Database Connection
    db_status = "healthy"
    pgvector_status = "unknown"
    try:
        result = await db.execute(text("SELECT 1;"))
        if result.scalar() != 1:
            db_status = "unhealthy"
        
        # Check pgvector extension status
        vector_res = await db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector';"))
        pgvector_status = "installed" if vector_res.scalar() == "vector" else "missing"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check Redis Connection
    redis_healthy = await check_redis_health()
    redis_status = "healthy" if redis_healthy else "unhealthy"

    overall_status = "ok" if (db_status == "healthy" and redis_healthy) else "degraded"

    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "components": {
            "database": {
                "status": db_status,
                "pgvector": pgvector_status
            },
            "redis": {
                "status": redis_status
            },
            "stt_driver": settings.STT_SERVICE_TYPE,
            "llm_driver": settings.LLM_SERVICE_TYPE
        }
    }
