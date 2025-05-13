import React from 'react';
import { Button, Container, Grid, Typography, Box, Paper } from '@mui/material';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../src/components/layout/Header';

export default function Home() {
  return (
    <>
      <Head>
        <title>TranscriptPro - AI-Powered Transcription Service</title>
        <meta name="description" content="Professional transcription service powered by AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main>
        <Container maxWidth="lg">
          <Box sx={{ pt: 8, pb: 6 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  component="h1"
                  variant="h2"
                  color="primary"
                  gutterBottom
                  fontWeight="bold"
                >
                  Transform Speech to Text with AI-Powered Precision
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                  Get accurate transcriptions of your audio and video files in minutes, not hours.
                  Our AI-powered solution delivers professional-grade transcripts for meetings, interviews,
                  podcasts, and more.
                </Typography>
                <Box sx={{ mt: 4 }}>
                  <Link href="/register" passHref>
                    <Button variant="contained" size="large" sx={{ mr: 2 }}>
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login" passHref>
                    <Button variant="outlined" size="large">
                      Login
                    </Button>
                  </Link>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'transparent'
                  }}
                >
                  <Box 
                    component="img"
                    src="/images/hero-image.svg"
                    alt="TranscriptPro illustration"
                    sx={{ 
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ py: 8 }}>
            <Typography variant="h3" align="center" gutterBottom>
              How It Works
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom>1. Upload</Typography>
                  <Typography>
                    Upload your audio or video files securely to our platform.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom>2. Process</Typography>
                  <Typography>
                    Our AI transcription engine processes your content with high accuracy.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom>3. Download</Typography>
                  <Typography>
                    Download your completed transcript in multiple formats.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </main>

      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} TranscriptPro. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
}
