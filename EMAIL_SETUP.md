# Email Configuration Guide

## Current Status
The password reset feature is currently in **development mode**. Reset links are displayed directly on the page instead of being sent via email.

## How to Set Up Email in Production

### Option 1: SendGrid (Recommended)

1. **Sign up for SendGrid**
   - Go to https://sendgrid.com/
   - Create a free account (100 emails/day free tier)

2. **Get your API Key**
   - In SendGrid dashboard, go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key

3. **Configure Environment Variables**
   Add to your `.env.local`:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Install SendGrid Package**
   ```bash
   npm install @sendgrid/mail
   ```

5. **Update the Code**
   In `app/api/auth/reset-password/route.ts`, uncomment the SendGrid code (lines 60-80)

### Option 2: Resend (Modern Alternative)

1. **Sign up for Resend**
   - Go to https://resend.com/
   - Create account (3,000 emails/month free)

2. **Get your API Key**
   - Create API key in dashboard

3. **Configure Environment Variables**
   ```
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Install Resend Package**
   ```bash
   npm install resend
   ```

5. **Update the Code**
   ```typescript
   import { Resend } from 'resend';
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   await resend.emails.send({
     from: process.env.RESEND_FROM_EMAIL!,
     to: email,
     subject: 'Reset Your Password',
     html: emailTemplate
   });
   ```

### Option 3: Nodemailer (SMTP)

For using your own SMTP server or Gmail:

1. **Install Nodemailer**
   ```bash
   npm install nodemailer
   ```

2. **Configure Environment Variables**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

3. **Update the Code**
   ```typescript
   import nodemailer from 'nodemailer';
   
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT!),
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASSWORD,
     },
   });
   
   await transporter.sendMail({
     from: process.env.SMTP_FROM,
     to: email,
     subject: 'Reset Your Password',
     html: emailTemplate
   });
   ```

## Testing

After configuring email:

1. Set `NODE_ENV=production` in your environment
2. Test password reset flow
3. Check spam folder if email doesn't arrive
4. Monitor email service dashboard for delivery status

## Security Considerations

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Verify sender email domain to avoid spam filters
- Set up SPF, DKIM, and DMARC records for your domain
- Monitor email sending for abuse

## Development Mode

In development (`NODE_ENV=development`):
- Reset links are displayed directly on the page
- Links are also logged to the server console
- No emails are sent

This allows testing without email configuration.
