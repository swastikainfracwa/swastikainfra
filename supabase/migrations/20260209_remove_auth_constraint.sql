-- Remove foreign key constraint from profiles table
-- We're using NextAuth.js now, not Supabase Auth, so profiles.id doesn't reference auth.users

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make id a regular primary key (not a foreign key)
-- Ensure the id column is set up correctly
ALTER TABLE public.profiles 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
