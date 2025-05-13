from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class File(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # File information
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)  # Unique internal name (UUID.ext)
    storage_url = Column(String, nullable=False)  # Full path in cloud storage
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration_seconds = Column(Float, nullable=True)  # Duration of the media file in seconds
    
    # Status fields
    upload_status = Column(String, nullable=False, default="uploaded")  # uploaded, failed_upload
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="files")
    transcription = relationship("Transcription", back_populates="file", uselist=False, cascade="all, delete-orphan")
