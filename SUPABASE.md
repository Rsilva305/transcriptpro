# Supabase Integration in TranscriptPro

This document explains how Supabase is integrated into the TranscriptPro application and why it's a good choice for this project.

## What is Supabase?

Supabase is an open source Firebase alternative that provides:
- PostgreSQL database
- Authentication
- Storage
- Realtime subscriptions
- API auto-generation
- Edge Functions (serverless)

## Why Supabase for TranscriptPro?

Supabase is an excellent choice for TranscriptPro for several reasons:

1. **Complete Backend Services**: Supabase provides multiple services that we need (auth, database, storage) in one platform, simplifying our architecture.

2. **PostgreSQL Database**: Supabase uses PostgreSQL, which is powerful, reliable, and supports advanced features needed for our application.

3. **Built-in Authentication**: Secure user authentication with email/password, social logins, and JWT tokens.

4. **Storage Solution**: Integrated file storage with security rules, perfect for managing audio and video files.

5. **Row Level Security (RLS)**: Built-in security policies that ensure users can only access their own data.

6. **Reduced Backend Complexity**: Many features can be implemented directly through Supabase, reducing custom backend code.

## Architecture with Supabase

Our architecture combines Supabase with a FastAPI backend:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────┐
│             │     │             │     │                      │
│  Frontend   │────►│  Supabase   │◄───►│  FastAPI Backend     │
│  (Next.js)  │     │             │     │  (Transcription      │
│             │     │             │     │   Processing)        │
└─────────────┘     └─────────────┘     └──────────────────────┘
        │                  │                       │
        │                  │                       │
        ▼                  ▼                       ▼
┌─────────────┐    ┌──────────────┐     ┌─────────────────────┐
│             │    │              │     │                     │
│ User Auth   │    │ Database &   │     │ AI Transcription    │
│             │    │ File Storage │     │ Service Integration │
└─────────────┘    └──────────────┘     └─────────────────────┘
```

### Component Responsibilities

1. **Frontend (Next.js)**:
   - Direct communication with Supabase for auth and basic CRUD operations
   - User interface for all application features

2. **Supabase**:
   - User authentication and management
   - Database storage for user data, files, and transcriptions
   - File storage for audio/video uploads
   - Row-level security policies

3. **FastAPI Backend**:
   - Complex business logic
   - Integration with external AI transcription services
   - Background processing jobs
   - API endpoints for operations not easily handled by Supabase directly

## Supabase Integration Points

### 1. Authentication

Frontend uses Supabase Auth directly:

```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})
```

### 2. Database Access

Both frontend and backend access the database through Supabase:

```typescript
// Frontend: Get user's transcriptions
const { data, error } = await supabase
  .from('transcriptions')
  .select('*, files(original_filename, duration_seconds)')
  .eq('user_id', user.id)
```

```python
# Backend: Update transcription status
response = supabase.table("transcriptions") \
    .update({"status": "processing"}) \
    .eq("id", transcription_id) \
    .execute()
```

### 3. File Storage

Upload and download files through Supabase Storage:

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('transcriptpro-files')
  .upload(`uploads/${userId}/${filename}`, file)

// Get file URL
const { data } = supabase.storage
  .from('transcriptpro-files')
  .getPublicUrl(`uploads/${userId}/${filename}`)
```

## Security Considerations

1. **Row Level Security (RLS)**: Database tables have policies that ensure users can only access their own data.

2. **Storage Policies**: Storage buckets have policies that limit file access to the file owner.

3. **API Access**: Backend uses Supabase service role key for admin-level operations while frontend uses anonymous key with RLS protection.

## Benefits of This Approach

1. **Simplified Authentication**: Using Supabase Auth eliminates the need to build custom auth systems.

2. **Reduced Backend Code**: Many operations can be performed directly from the frontend.

3. **Security by Default**: RLS policies ensure data protection without extensive custom security code.

4. **Scalability**: Supabase is built on PostgreSQL and can scale to handle growing application needs.

5. **Development Speed**: Faster development with fewer custom components to build and maintain.

## Getting Started with Supabase

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Set up database tables as outlined in README.md
4. Configure storage buckets and security policies
5. Add your Supabase URL and keys to your environment files

## Conclusion

Integrating Supabase into TranscriptPro provides a robust, secure foundation for the application while allowing us to focus on building the unique features of our transcription service rather than reinventing common backend functionality. 