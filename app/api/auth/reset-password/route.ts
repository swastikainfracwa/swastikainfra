import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      // Don't reveal if user exists or not for security
      console.log('User not found for email:', email);
      console.log('Fetch error:', fetchError);
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive reset instructions.' 
      });
    }

    console.log('✅ User found:', user.email, '- Generating reset token...');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error storing reset token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    // In production, send email here using an email service (SendGrid, AWS SES, etc.)
    // For development, we'll log the token and return it in the response
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('='.repeat(80));
    console.log('PASSWORD RESET REQUEST');
    console.log('='.repeat(80));
    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Reset URL:', resetUrl);
    console.log('Token expires:', resetTokenExpires.toLocaleString());
    console.log('='.repeat(80));
    console.log('');
    console.log('📧 EMAIL NOT CONFIGURED - Development Mode');
    console.log('To send real emails in production:');
    console.log('1. Install an email service SDK (e.g., npm install @sendgrid/mail)');
    console.log('2. Add your API key to .env.local: SENDGRID_API_KEY=your_key');
    console.log('3. Uncomment and configure the sendEmail code below');
    console.log('='.repeat(80));

    // TODO: Implement email sending
    // Example with SendGrid:
    // import sgMail from '@sendgrid/mail';
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    // await sgMail.send({
    //   to: email,
    //   from: process.env.SENDGRID_FROM_EMAIL!,
    //   subject: 'Reset Your Password - Swastika Infrastructures',
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <h1 style="color: #1e40af;">Reset Your Password</h1>
    //       <p>Hi ${user.name},</p>
    //       <p>You requested to reset your password for Swastika Infrastructures. Click the button below to continue:</p>
    //       <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
    //       <p style="color: #6b7280;">Or copy this link: ${resetUrl}</p>
    //       <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
    //       <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    //     </div>
    //   `
    // });

    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive reset instructions.',
      // In development, include the token
      ...(process.env.NODE_ENV === 'development' && { 
        dev_reset_url: resetUrl 
      })
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
