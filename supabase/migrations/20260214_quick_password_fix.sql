-- Quick fix to verify password_hash column exists and is being used correctly
-- Run this if users created from admin dashboard cannot login

-- Step 1: Ensure password_hash column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 2: Create index if not exists
CREATE INDEX IF NOT EXISTS profiles_password_hash_idx ON public.profiles(password_hash) WHERE password_hash IS NOT NULL;

-- Step 3: Remove old 'password' column if it exists (to avoid confusion)
-- Note: Only run this if you're sure the correct column is password_hash
-- ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- Step 4: Check which users have NULL password_hash
SELECT 
  id,
  name,
  email,
  role,
  password_hash IS NULL as has_null_password,
  created_at
FROM profiles
WHERE password_hash IS NULL
ORDER BY created_at DESC;

-- Step 5: Verification - Show column info
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE '%password%';
