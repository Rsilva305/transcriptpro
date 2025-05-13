import os
from supabase import create_client

# Load Supabase configuration from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Create Supabase client (this will be lazily initialized when needed)
def get_supabase_client():
    """
    Create and return a Supabase client using environment variables.
    
    The service key (not anon key) should be used for backend operations
    to have full database access rights.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Supabase configuration missing. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper functions for common operations

async def get_user_by_id(user_id: str):
    """Get user information by user ID including profile data."""
    supabase = get_supabase_client()
    
    # Get auth user info
    auth_response = supabase.auth.admin.get_user_by_id(user_id)
    
    if not auth_response.user:
        return None
    
    # Get user profile info
    profile_response = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
    profile_data = profile_response.data[0] if profile_response.data else {}
    
    # Combine auth user and profile data
    user_data = {
        "id": auth_response.user.id,
        "email": auth_response.user.email,
        "created_at": auth_response.user.created_at,
        **profile_data
    }
    
    return user_data

async def ensure_user_profile(user_id: str):
    """Ensure user profile exists, create if it doesn't."""
    supabase = get_supabase_client()
    
    # Check if profile exists
    profile_response = supabase.table("user_profiles").select("id").eq("id", user_id).execute()
    
    # If profile doesn't exist, create it
    if not profile_response.data:
        supabase.table("user_profiles").insert({
            "id": user_id,
            "quota_minutes": 60,  # Default free minutes
            "is_admin": False
        }).execute()

async def create_file_record(user_id: str, filename: str, size: int, storage_path: str):
    """Create a new file record in the database."""
    supabase = get_supabase_client()
    response = supabase.table("files").insert({
        "user_id": user_id,
        "original_filename": filename,
        "size": size,
        "upload_status": "uploaded",
        "storage_path": storage_path
    }).execute()
    return response.data[0] if response.data else None

async def update_transcription_status(transcription_id: str, status: str):
    """Update the status of a transcription."""
    supabase = get_supabase_client()
    response = supabase.table("transcriptions").update({
        "status": status
    }).eq("id", transcription_id).execute()
    return response.data[0] if response.data else None 