-- Add password column to profiles table for NextAuth authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Add comment
COMMENT ON COLUMN profiles.password IS 'Hashed password for NextAuth credentials authentication';
