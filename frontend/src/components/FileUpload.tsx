import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Box, Typography, LinearProgress, Alert } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  onUploadComplete: (fileData: any) => void;
}

// Define the progress type
interface UploadProgressEvent {
  loaded: number;
  total: number;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const validateFile = (file: File) => {
    // Get max file size from env (default to 200MB if not set)
    const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '200000000');
    
    // Check file size
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${maxFileSize / 1000000}MB.`);
      return false;
    }
    
    // Check file type (audio/video)
    const allowedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an audio or video file.');
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!session?.user?.id) {
      setError('You must be logged in to upload files');
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Generate a unique filename with UUID to prevent conflicts
      const fileExt = file.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExt}`;
      const storagePath = `uploads/${session.user.id}/${uniqueFilename}`;
      const bucketName = 'transcriptpro-files';

      // Use XMLHttpRequest to track upload progress
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const url = `${projectUrl}/storage/v1/object/${bucketName}/${storagePath}`;

      // Get auth headers using session token
      const authHeaders = {
        Authorization: `Bearer ${session?.accessToken || ''}`,
        'Content-Type': 'multipart/form-data'
      };
      
      // Create a new Promise to handle the XMLHttpRequest
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };
        
        // Handle completion
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // Create file record in database
              const { data: fileRecord, error: fileError } = await supabase
                .from('files')
                .insert({
                  user_id: session.user.id,
                  original_filename: file.name,
                  size: file.size,
                  upload_status: 'uploaded',
                  storage_path: storagePath
                })
                .select()
                .single();

              if (fileError) {
                throw new Error(fileError.message);
              }
              
              resolve(fileRecord);
            } catch (err: any) {
              reject(err);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        // Handle errors
        xhr.onerror = () => {
          reject(new Error('Upload failed due to a network error'));
        };
        
        xhr.open('POST', url, true);
        
        // Set headers
        for (const [key, value] of Object.entries(authHeaders)) {
          xhr.setRequestHeader(key, value as string);
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('', file);
        formData.append('cacheControl', '3600');
        
        // Send the request
        xhr.send(formData);
      });

      // Wait for upload to complete
      const fileRecord = await uploadPromise;
      
      // Call the provided callback with file data
      onUploadComplete(fileRecord);
      
      // Reset state
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Audio or Video File
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <input
        id="file-upload"
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          component="label"
          htmlFor="file-upload"
          disabled={uploading}
          sx={{ mr: 2 }}
        >
          Select File
        </Button>
        
        <Typography variant="body1" noWrap sx={{ maxWidth: '300px' }}>
          {file ? file.name : 'No file selected'}
        </Typography>
      </Box>
      
      {file && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Size: {(file.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Type: {file.type}
          </Typography>
        </Box>
      )}
      
      {uploading && (
        <Box sx={{ width: '100%', my: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            {progress}% Uploaded
          </Typography>
        </Box>
      )}
      
      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadIcon />}
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </Box>
  );
} 