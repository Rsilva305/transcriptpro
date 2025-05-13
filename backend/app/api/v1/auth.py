from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.config import settings
from app.core.supabase import get_supabase_client
from app.db.session import get_db_session
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.user import authenticate_supabase_user, get_supabase_user_by_email
from app.core.supabase import ensure_user_profile

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user_data = await authenticate_supabase_user(email=form_data.username, password=form_data.password)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "access_token": user_data["access_token"],
        "token_type": user_data["token_type"],
        "user_id": user_data["id"]
    }


@router.post("/register", response_model=UserResponse)
async def register_new_user(
    user_in: RegisterRequest,
) -> Any:
    """
    Register a new user using Supabase.
    """
    supabase = get_supabase_client()
    
    try:
        # Check if user exists in Supabase Auth
        existing_user = await get_supabase_user_by_email(email=user_in.email)
        
        if existing_user:
            # User already exists, just ensure they have a profile
            user_id = existing_user["id"]
            await ensure_user_profile(user_id)
            
            # Return existing user data
            return {
                "id": user_id,
                "email": user_in.email,
                "is_active": True,
                "is_admin": existing_user.get("is_admin", False),
                "quota_minutes": existing_user.get("quota_minutes", settings.DEFAULT_FREE_MINUTES),
                "created_at": existing_user.get("created_at")
            }
        
        # Create new user in Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": user_in.email,
            "password": user_in.password,
            "email_confirm": True  # Auto-confirm email for now
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account",
            )
        
        user_id = auth_response.user.id
        
        # Create user profile with default values
        # Use upsert to prevent duplicate key errors
        profile_response = supabase.table("user_profiles").upsert({
            "id": user_id,
            "quota_minutes": settings.DEFAULT_FREE_MINUTES,
            "is_admin": False
        }).execute()
        
        # Return user data
        return {
            "id": user_id,
            "email": user_in.email,
            "is_active": True,
            "is_admin": False,
            "quota_minutes": settings.DEFAULT_FREE_MINUTES,
            "created_at": auth_response.user.created_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}",
        )
