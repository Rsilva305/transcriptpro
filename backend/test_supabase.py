import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client

# Manually load environment variables from .env file
load_dotenv()

# Get Supabase credentials 
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY[:10]}...{SUPABASE_KEY[-5:] if SUPABASE_KEY else ''}")

async def test_connection():
    """Test Supabase connection and basic operations"""
    print("\nTesting Supabase connection...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing Supabase credentials. Please check your .env file.")
        return
    
    try:
        # Create Supabase client directly
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Test 1: Check if we can connect by retrieving user profiles
        print("Test 1: Querying user_profiles table...")
        setting_response = supabase.table("user_profiles").select("*").limit(1).execute()
        print(f"✅ Connection successful! Response data: {setting_response.data}")
        
        # Test 2: List tables in public schema
        print("\nTest 2: Listing tables in the public schema:")
        try:
            tables = supabase.rpc('get_tables').execute()
            if tables.data:
                for table in tables.data:
                    print(f"- {table}")
            else:
                print("No tables found or insufficient permissions.")
        except Exception as e:
            print(f"Cannot query tables: {str(e)}")
            # Fallback - just list the tables we know should exist
            print("Expected tables: user_profiles, files, transcriptions")
            
        # Test 3: Check storage bucket
        print("\nTest 3: Checking storage bucket...")
        try:
            bucket_list = supabase.storage.list_buckets()
            print(f"Available buckets: {[b['name'] for b in bucket_list]}")
            
            if any(b['name'] == 'transcriptpro-files' for b in bucket_list):
                print("✅ Storage bucket 'transcriptpro-files' exists")
            else:
                print("❌ Storage bucket 'transcriptpro-files' not found")
        except Exception as e:
            print(f"❌ Storage bucket error: {str(e)}")
        
        print("\nAll tests completed!")
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_connection()) 