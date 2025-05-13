import os
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import httpx
import tempfile
import json

from app.db.session import get_db_session
from app.services.user import get_current_user
from app.models.user import User
from app.core.supabase import get_supabase_client

router = APIRouter()

# Configuration for external transcription API
TRANSCRIPTION_API_KEY = os.environ.get("TRANSCRIPTION_API_KEY", "")
TRANSCRIPTION_API_URL = os.environ.get("TRANSCRIPTION_API_URL", "")

@router.get("/")
async def get_transcriptions(
    current_user: User = Depends(get_current_user),
):
    """
    Get all transcriptions for the current user.
    """
    try:
        # Use Supabase client to get transcriptions for the current user
        supabase = get_supabase_client()
        response = supabase.table("transcriptions") \
            .select("*, files(original_filename, duration_seconds)") \
            .eq("user_id", current_user.id) \
            .execute()
            
        return {"transcriptions": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving transcriptions: {str(e)}"
        )

@router.get("/{transcription_id}")
async def get_transcription(
    transcription_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific transcription by ID.
    """
    try:
        # Use Supabase client to get a specific transcription
        supabase = get_supabase_client()
        response = supabase.table("transcriptions") \
            .select("*, files(original_filename, duration_seconds)") \
            .eq("id", transcription_id) \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcription not found"
            )
            
        return response.data
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcription not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving transcription: {str(e)}"
        )

@router.post("/")
async def create_transcription(
    background_tasks: BackgroundTasks,
    file_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Create a new transcription job for a file.
    """
    try:
        supabase = get_supabase_client()
        
        # First, check if the file exists and belongs to this user
        file_response = supabase.table("files") \
            .select("*") \
            .eq("id", file_id) \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()
        
        if not file_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or doesn't belong to the current user"
            )
        
        # Create a new transcription entry
        transcription_response = supabase.table("transcriptions") \
            .insert({
                "file_id": file_id,
                "user_id": current_user.id,
                "status": "pending"
            }) \
            .select() \
            .single() \
            .execute()
        
        # Start the transcription process in the background
        transcription_id = transcription_response.data["id"]
        background_tasks.add_task(
            process_transcription, 
            transcription_id=transcription_id,
            file_id=file_id,
            user_id=current_user.id
        )
        
        return {
            "message": "Transcription job created and processing started", 
            "transcription": transcription_response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating transcription: {str(e)}"
        )

@router.put("/{transcription_id}/text")
async def update_transcription_text(
    transcription_id: str,
    transcript_text: str,
    current_user: User = Depends(get_current_user),
):
    """
    Update the text of a transcription.
    """
    try:
        supabase = get_supabase_client()
        
        # Check if the transcription exists and belongs to this user
        existing = supabase.table("transcriptions") \
            .select("id") \
            .eq("id", transcription_id) \
            .eq("user_id", current_user.id) \
            .single() \
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcription not found or doesn't belong to the current user"
            )
        
        # Update the transcription text
        response = supabase.table("transcriptions") \
            .update({"text": transcript_text}) \
            .eq("id", transcription_id) \
            .select() \
            .single() \
            .execute()
        
        return response.data
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcription not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating transcription: {str(e)}"
        )

async def process_transcription(transcription_id: str, file_id: str, user_id: str):
    """
    Background task to process a transcription.
    """
    supabase = get_supabase_client()
    
    try:
        # Update status to processing
        supabase.table("transcriptions") \
            .update({"status": "processing"}) \
            .eq("id", transcription_id) \
            .execute()
        
        # Get file path from storage
        file_info = supabase.table("files") \
            .select("storage_path") \
            .eq("id", file_id) \
            .single() \
            .execute()
        
        if not file_info.data:
            raise Exception("File not found")
        
        storage_path = file_info.data["storage_path"]
        
        # Get file content from Supabase Storage
        file_content = supabase.storage \
            .from_("transcriptpro-files") \
            .download(storage_path)
        
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(storage_path)[1]) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Call external transcription API
            # This is a placeholder - replace with your actual transcription service
            if TRANSCRIPTION_API_URL and TRANSCRIPTION_API_KEY:
                async with httpx.AsyncClient() as client:
                    with open(temp_file_path, "rb") as f:
                        files = {"file": f}
                        headers = {"Authorization": f"Bearer {TRANSCRIPTION_API_KEY}"}
                        
                        response = await client.post(
                            TRANSCRIPTION_API_URL,
                            files=files,
                            headers=headers,
                            timeout=300  # 5 minutes timeout
                        )
                        
                        if response.status_code != 200:
                            raise Exception(f"Transcription API error: {response.text}")
                        
                        result = response.json()
                        
                        # Update transcription with results
                        supabase.table("transcriptions") \
                            .update({
                                "text": result.get("text", ""),
                                "segments": result.get("segments", []),
                                "status": "completed"
                            }) \
                            .eq("id", transcription_id) \
                            .execute()
            else:
                # For demo/development: generate a fake transcription
                fake_text = "This is a placeholder transcription. The real transcription would be generated by an AI service."
                fake_segments = [
                    {"start": 0, "end": 5, "text": "This is a placeholder transcription."},
                    {"start": 5, "end": 10, "text": "The real transcription would be generated by an AI service."}
                ]
                
                # Update with fake results
                supabase.table("transcriptions") \
                    .update({
                        "text": fake_text,
                        "segments": fake_segments,
                        "status": "completed"
                    }) \
                    .eq("id", transcription_id) \
                    .execute()
                    
        except Exception as e:
            # Set status to failed if an error occurs during transcription
            supabase.table("transcriptions") \
                .update({
                    "status": "failed",
                    "text": f"Error: {str(e)}"
                }) \
                .eq("id", transcription_id) \
                .execute()
            raise e
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except Exception as e:
        # Set status to failed if an error occurs
        supabase.table("transcriptions") \
            .update({
                "status": "failed",
                "text": f"Error: {str(e)}"
            }) \
            .eq("id", transcription_id) \
            .execute()
