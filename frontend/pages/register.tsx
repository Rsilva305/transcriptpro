import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import RegisterForm from '../src/components/auth/RegisterForm';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';

const RegisterPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Create Account - TranscriptPro</title>
        <meta name="description" content="Sign up for TranscriptPro to start transcribing your audio and video files" />
      </Head>
      <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Join TranscriptPro
          </Typography>
          <RegisterForm />
        </Box>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

export default RegisterPage;
