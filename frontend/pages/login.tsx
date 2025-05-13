import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import LoginForm from '../src/components/auth/LoginForm';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';

const LoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Login - TranscriptPro</title>
        <meta name="description" content="Login to your TranscriptPro account" />
      </Head>
      <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome Back
          </Typography>
          <LoginForm />
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

export default LoginPage;
