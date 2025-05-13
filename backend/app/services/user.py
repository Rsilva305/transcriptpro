from typing import Optional, Union, Dict, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.supabase import get_supabase_client, get_user_by_id, ensure_user_profile
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_supabase_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by email using Supabase.
    """
    supabase = get_supabase_client()
    try:
        # Get all users and filter by email
        response = supabase.auth.admin.list_users()
        
        users = response.users
        if not users:
            return None
        
        # Find user with matching email
        matching_users = [user for user in users if user.email == email]
        if not matching_users:
            return None
            
        user = matching_users[0]
        
        # Get user profile data
        profile_response = supabase.table("user_profiles").select("*").eq("id", user.id).execute()
        profile_data = profile_response.data[0] if profile_response.data else {}
        
        # Combine user and profile data
        user_data = {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at,
            "is_active": not user.banned_until,
            **profile_data
        }
        
        return user_data
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None


async def authenticate_supabase_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user through Supabase authentication.
    """
    try:
        supabase = get_supabase_client()
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if not auth_response.user:
            return None
        
        # Get user profile data
        user_id = auth_response.user.id
        
        # Ensure user has a profile
        await ensure_user_profile(user_id)
        
        # Get profile data
        profile_response = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        profile_data = profile_response.data[0] if profile_response.data else {}
        
        # Combine user and profile data
        user_data = {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
            "created_at": auth_response.user.created_at,
            "is_active": True,
            **profile_data,
            "access_token": auth_response.session.access_token,
            "token_type": "bearer"
        }
        
        return user_data
    except Exception as e:
        print(f"Authentication error: {e}")
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Get the current authenticated user from Supabase token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify token with Supabase
        supabase = get_supabase_client()
        auth_response = supabase.auth.get_user(token)
        
        if not auth_response or not auth_response.user:
            raise credentials_exception
        
        user_id = auth_response.user.id
        
        # Get complete user info including profile
        user_data = await get_user_by_id(user_id)
        
        if not user_data:
            raise credentials_exception
        
        # Add the User model for compatibility with existing endpoints
        user_data["token"] = token
        
        return user_data
        
    except Exception as e:
        print(f"Error getting current user: {e}")
        raise credentials_exception
