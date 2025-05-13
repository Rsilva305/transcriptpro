-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  duration_seconds FLOAT,
  upload_status TEXT DEFAULT 'uploaded' NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS files_user_id_idx ON public.files(user_id);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create security policy
CREATE POLICY "Users can only access their own files"
  ON public.files
  FOR ALL
  USING (auth.uid() = user_id);