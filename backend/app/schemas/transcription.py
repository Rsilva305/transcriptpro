from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import BaseModel


# Shared properties
class TranscriptionBase(BaseModel):
    file_id: int


# Properties to receive via API on creation
class TranscriptionCreate(TranscriptionBase):
    pass


# Properties to return via API
class TranscriptionInDBBase(TranscriptionBase):
    id: int
    user_id: int
    file_id: int
    transcription_text: Optional[str] = None
    segments: Optional[List[Dict[str, Any]]] = None
    language: Optional[str] = None
    status: str
    processing_duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


# Properties to return via API
class Transcription(TranscriptionInDBBase):
    pass


# Additional properties stored in DB
class TranscriptionInDB(TranscriptionInDBBase):
    pass


# For returning transcription status updates
class TranscriptionStatus(BaseModel):
    id: int
    status: str
    progress: Optional[float] = None  # 0.0 to 1.0 progress indicator


# For returning completed transcription
class TranscriptionResult(BaseModel):
    id: int
    file_id: int
    transcription_text: str
    segments: Optional[List[Dict[str, Any]]] = None
    language: Optional[str] = None
    completed_at: datetime
    processing_duration: float
