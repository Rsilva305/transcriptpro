import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '../../../src/lib/supabase';

// Define custom user type to include accessToken
interface CustomUser {
  id: string;
  email: string;
  accessToken: string;
}

// Extend the session types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
    } & DefaultSession["user"];
  }
  
  interface JWT {
    accessToken?: string;
  }
}

// The URL for our API is now Supabase
const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call Supabase auth service instead of our custom API
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('Authentication error:', error.message);
            return null;
          }

          if (data && data.user && data.session) {
            // Return the user object with token from Supabase
            return {
              id: data.user.id,
              email: data.user.email as string,
              accessToken: data.session.access_token
            };
          }
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        // Use type assertion to tell TypeScript that user has accessToken
        token.accessToken = (user as CustomUser).accessToken;
        token.email = (user as CustomUser).email || '';
        token.sub = (user as CustomUser).id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      
      if (session.user) {
        session.user.email = token.email || '';
        session.user.id = token.sub;
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
