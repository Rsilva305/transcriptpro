   -- Create Storage bucket policies
   
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