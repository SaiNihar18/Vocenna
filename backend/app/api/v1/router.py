from fastapi import APIRouter
from app.api.v1 import health, auth, rooms, transcripts

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(transcripts.router, tags=["Transcripts"])

