from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Shared properties
class FileBase(BaseModel):
    original_filename: str


# Properties to receive via API on file creation
class FileCreate(FileBase):
    pass


# Properties to return via API
class FileInDBBase(FileBase):
    id: int
    user_id: int
    original_filename: str
    stored_filename: str
    storage_url: str
    file_size: Optional[int] = None
    duration_seconds: Optional[float] = None
    upload_status: str
    created_at: datetime
    
    class Config:
        orm_mode = True


# Properties to return via API
class File(FileInDBBase):
    pass


# Additional properties stored in DB
class FileInDB(FileInDBBase):
    pass


# File upload response
class FileUploadResponse(BaseModel):
    id: int
    original_filename: str
    upload_status: str
    file_size: Optional[int] = None
