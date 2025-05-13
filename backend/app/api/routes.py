from fastapi import APIRouter

from app.api.v1 import auth, users, files, transcriptions

# Create main API router
router = APIRouter()

# Include specific API endpoint groups
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(files.router, prefix="/files", tags=["Files"])
router.include_router(transcriptions.router, prefix="/transcriptions", tags=["Transcriptions"])
