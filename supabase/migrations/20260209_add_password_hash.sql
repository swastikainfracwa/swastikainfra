-- Add password_hash column to profiles table for NextAuth.js
-- Run this migration in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_password_hash_idx ON public.profiles(password_hash) WHERE password_hash IS NOT NULL;
