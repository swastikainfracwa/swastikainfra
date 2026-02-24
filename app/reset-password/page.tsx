'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const confirmResetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type ConfirmResetFormData = z.infer<typeof confirmResetSchema>;

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const token = searchParams.get('token');

  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const confirmForm = useForm<ConfirmResetFormData>({
    resolver: zodResolver(confirmResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onRequestReset = async (data: RequestResetFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        
        // In development, show the reset URL directly
        if (result.dev_reset_url) {
          setDevResetUrl(result.dev_reset_url);
        }
        
        toast({
          title: 'Reset link sent!',
          description: result.dev_reset_url 
            ? 'Development mode: Reset link is shown below.' 
            : 'Check your email for password reset instructions.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send reset link. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Reset request error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmReset = async (data: ConfirmResetFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          newPassword: data.password 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: 'Password reset successful!',
          description: 'You can now login with your new password.',
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset password. The link may have expired.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Reset confirm error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Image 
            src="/Swastika%20logo.png" 
            alt="Swastika Infrastructures" 
            width={40} 
            height={40} 
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-2xl font-bold text-foreground">Swastika Infrastructures</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {resetSuccess ? 'Password Reset!' : token ? 'Create New Password' : emailSent ? 'Check Your Email' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {resetSuccess
                ? 'Redirecting you to login...'
                : token
                ? 'Enter your new password below'
                : emailSent
                ? 'We sent password reset instructions to your email'
                : 'Enter your email to receive reset instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Taking you to login page...</p>
              </div>
            ) : token ? (
              // Confirm reset form (with token)
              <Form {...confirmForm}>
                <form onSubmit={confirmForm.handleSubmit(onConfirmReset)} className="space-y-4">
                  <FormField
                    control={confirmForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="••••••••" 
                              className="pl-9 pr-9" 
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={confirmForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showConfirmPassword ? 'text' : 'password'} 
                              placeholder="••••••••" 
                              className="pl-9 pr-9" 
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </Form>
            ) : emailSent ? (
              // Email sent confirmation
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    If an account exists with this email, you will receive password reset instructions.
                  </p>
                  
                  {devResetUrl && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        🔧 Development Mode
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                        Email sending is not configured. Click the link below to reset your password:
                      </p>
                      <a 
                        href={devResetUrl}
                        className="block w-full p-2 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-primary hover:bg-yellow-50 dark:hover:bg-gray-700 break-all"
                      >
                        {devResetUrl}
                      </a>
                    </div>
                  )}
                  
                  {!devResetUrl && (
                    <p className="text-xs text-muted-foreground">
                      Note: In development, the reset token is logged to the console.
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setDevResetUrl(null);
                    requestForm.reset();
                  }}
                >
                  Try Different Email
                </Button>
              </div>
            ) : (
              // Request reset form
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="you@example.com" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
