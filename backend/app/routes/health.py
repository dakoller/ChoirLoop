"""Health check endpoint"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "ChoirLoop API is running"}
