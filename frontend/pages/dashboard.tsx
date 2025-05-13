import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import api from '../src/services/api';
import AddIcon from '@mui/icons-material/Add';

// Language map for display purposes
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ar': 'Arabic',
};

// Define types for file metadata
interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  duration_seconds: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  language?: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's files when component mounts
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const data = await api.files.getAll();
        setFiles(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching files:', err);
        setError(err.message || 'Failed to load your files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleNewTranscription = () => {
    router.push('/transcribe');
  };

  const handleViewTranscription = (fileId: string) => {
    router.push(`/transcriptions/${fileId}`);
  };

  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration in mm:ss format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date in a readable format
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get language name from code
  const getLanguageName = (code?: string): string => {
    if (!code) return 'English (default)';
    return LANGUAGE_MAP[code] || code;
  };

  return (
    <>
      <Head>
        <title>Dashboard - TranscriptPro</title>
        <meta name="description" content="View and manage your transcriptions" />
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Your Transcriptions
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleNewTranscription}
            >
              New Transcription
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography>{error}</Typography>
            </Paper>
          ) : files.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No transcriptions yet
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Get started by creating your first transcription.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleNewTranscription}
              >
                New Transcription
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.filename}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{formatDuration(file.duration_seconds)}</TableCell>
                      <TableCell>{getLanguageName(file.language)}</TableCell>
                      <TableCell>{formatDate(file.upload_date)}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: 
                              file.status === 'completed' ? 'success.light' : 
                              file.status === 'failed' ? 'error.light' : 
                              file.status === 'processing' ? 'warning.light' : 'info.light',
                            color: 
                              file.status === 'completed' ? 'success.contrastText' : 
                              file.status === 'failed' ? 'error.contrastText' : 
                              file.status === 'processing' ? 'warning.contrastText' : 'info.contrastText',
                          }}
                        >
                          {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleViewTranscription(file.id)}
                          disabled={file.status !== 'completed'}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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

export default Dashboard;
