'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import type { User, AuthState, SignupData } from '@/types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);

  // Update user state when session changes
  useEffect(() => {
    if (session?.user) {
      const userData = {
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name!,
        phone: (session.user as any).phone,
        role: (session.user as any).role,
        enable_2fa: (session.user as any).enable_2fa || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [session, status]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        return false;
      }

      if (result?.ok) {
        // Force session update after successful login
        await update();
        // Wait a bit for session to fully establish
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [update]);

  const signup = useCallback(async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call the signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Signup failed. Please try again.',
        };
      }

      // After successful signup, log the user in
      const loginSuccess = await login(signupData.email, signupData.password);

      if (!loginSuccess) {
        return {
          success: false,
          error: 'Account created but login failed. Please try logging in.',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Signup failed:', error);
      return {
        success: false,
        error: error?.message || 'An unexpected error occurred. Please try again.',
      };
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  if (status === 'loading') {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
