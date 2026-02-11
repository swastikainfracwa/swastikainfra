import NextAuth, { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/server';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const supabase = createAdminClient();

        // Get user from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', credentials.email as string)
          .single();

        if (error || !profile) {
          throw new Error('Invalid email or password');
        }

        // Verify password
        if (!profile.password_hash) {
          throw new Error('Account created with Supabase Auth. Please reset password or contact support.');
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          profile.password_hash
        );

        if (!passwordMatch) {
          throw new Error('Invalid email or password');
        }

        // Return user data
        const userData = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          phone: profile.phone,
          enable_2fa: profile.enable_2fa || false,
        };
        
        return userData;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
        token.enable_2fa = (user as any).enable_2fa;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Always create/populate the user object from token
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
        phone: token.phone as string,
        enable_2fa: token.enable_2fa as boolean,
      } as any;
      
      return session;
    },
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
};

export function auth() {
  return getServerSession(authOptions);
}
