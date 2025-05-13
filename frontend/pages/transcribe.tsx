import React, { useState, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button, 
  LinearProgress,
  Alert,
  TextField,
  IconButton,
  Divider
} from '@mui/material';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import api from '../src/services/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LanguageSelector } from '../src/components/transcription';

const TranscribePage: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 200MB)
      const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '200000000');
      if (file.size > maxSize) {
        setError(`File is too large. Maximum size is ${maxSize / 1000000} MB.`);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', selectedLanguage);
      
      // Mock progress updates (since we don't have real progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 95 ? newProgress : prev;
        });
      }, 500);
      
      // Upload the file
      const response = await api.files.upload(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <>
      <Head>
        <title>New Transcription - TranscriptPro</title>
        <meta name="description" content="Upload a file for transcription" />
      </Head>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton onClick={() => router.push('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              New Transcription
            </Typography>
          </Box>
          
          <Paper sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upload Audio or Video File
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported formats: MP3, WAV, MP4, MOV, M4A (Max size: 200MB)
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                mb: 3,
                cursor: 'pointer',
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={handleBrowseClick}
            >
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                {selectedFile ? selectedFile.name : 'Click or drag a file here to upload'}
              </Typography>
              {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                  {(selectedFile.size / 1000000).toFixed(2)} MB
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onChange={handleLanguageChange}
              disabled={uploading}
            />
            
            {uploading && (
              <Box sx={{ mb: 3, mt: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  {uploadProgress}% Uploaded
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              startIcon={<CloudUploadIcon />}
              sx={{ mt: 2 }}
            >
              {uploading ? 'Uploading...' : 'Upload and Transcribe'}
            </Button>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

export default TranscribePage;
