from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float, JSON
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Transcription(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("file.id"), nullable=False, unique=True)
    
    # Transcription details
    transcription_text = Column(Text, nullable=True)  # The full text transcription
    segments = Column(JSON, nullable=True)  # Timestamped segments with speaker diarization
    language = Column(String(10), nullable=True)  # Detected language code
    
    # Processing information
    status = Column(String, nullable=False, default="pending")  # pending, processing, completed, failed
    processing_duration = Column(Float, nullable=True)  # How long transcription took in seconds
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)  # When transcription was completed
    
    # Relationships
    user = relationship("User", back_populates="transcriptions")
    file = relationship("File", back_populates="transcription")
