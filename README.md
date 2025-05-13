# TranscriptPro - AI Audio/Video Transcription Service

TranscriptPro is a modern web application that converts audio and video files into accurate text transcripts using AI technology. It provides a user-friendly interface for uploading media files, managing transcriptions, and exporting the results.

## Technology Stack

- **Frontend**: Next.js with TypeScript, Material UI
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Infrastructure**: Docker for local development

## Prerequisites

- Node.js 16+
- Python 3.9+
- Docker and Docker Compose
- Supabase account

## Supabase Setup

1. Create a project on [Supabase](https://supabase.com/)
2. Set up the following tables in your Supabase database:

### Users Table (Already managed by Supabase Auth)

Supabase Auth handles the users table automatically. Add a few custom fields via SQL:

```sql
ALTER TABLE auth.users
ADD COLUMN quota_minutes INTEGER DEFAULT 60 NOT NULL,
ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
```

### Files Table

```sql
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  duration_seconds FLOAT,
  upload_status TEXT DEFAULT 'uploaded' NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for faster user-specific queries
CREATE INDEX files_user_id_idx ON public.files(user_id);

-- RLS (Row Level Security) policy
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own files
CREATE POLICY "Users can only access their own files"
  ON public.files
  FOR ALL
  USING (auth.uid() = user_id);
```

### Transcriptions Table

```sql
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT,
  segments JSONB,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX transcriptions_file_id_idx ON public.transcriptions(file_id);
CREATE INDEX transcriptions_user_id_idx ON public.transcriptions(user_id);

-- RLS (Row Level Security) policy
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own transcriptions
CREATE POLICY "Users can only access their own transcriptions"
  ON public.transcriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

### Storage Setup

1. Create a new storage bucket called `transcriptpro-files`
2. Set up the following policies for the storage bucket:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transcriptpro-files' AND (auth.uid() IN (SELECT id FROM auth.users)));

-- Allow users to read only their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'transcriptpro-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete only their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'transcriptpro-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Environment Setup

1. Copy frontend/.env.example to frontend/.env
2. Copy backend/.env.example to backend/.env
3. Update the environment variables with your Supabase credentials:

For frontend/.env:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For backend/.env:
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

## Development Setup

1. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

2. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Start the development environment using Docker:
   ```
   docker-compose up
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1
   - API Documentation: http://localhost:8000/api/v1/docs

## Features

- User authentication and registration
- File upload with progress tracking
- AI-powered transcription
- Transcript viewing and editing
- Export options
- Freemium usage model

## License

This project is licensed under the MIT License. 