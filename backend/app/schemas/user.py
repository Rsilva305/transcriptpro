from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, validator


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    
    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    quota_minutes: Optional[int] = None
    
    @validator("password")
    def password_min_length(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


# User profile schema
class UserProfile(BaseModel):
    quota_minutes: int = 60
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Properties to return via API
class UserInDBBase(UserBase):
    id: str
    email: EmailStr
    created_at: datetime
    
    class Config:
        orm_mode = True


# Properties to return via API
class User(UserInDBBase):
    is_active: bool = True
    quota_minutes: int = 60
    is_admin: bool = False


# User response model for API endpoints
class UserResponse(User):
    pass


# Additional properties stored in DB but not returned
class UserInDB(UserInDBBase):
    is_active: bool = True
    password_hash: str
