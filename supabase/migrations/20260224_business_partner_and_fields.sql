-- Migration: Add Business Partner role, address field, creator tracking, and password reset fields
-- Date: 2026-02-24

-- Step 1: Add address column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Add created_by column to track who created each user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 3: Add password reset fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Step 4: Update role enum to include business_partner
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('visitor', 'owner', 'agent', 'manager', 'admin', 'business_partner'));

-- Step 5: Create index on created_by for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);

-- Step 6: Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON public.profiles(reset_token);

-- Step 7: Add comment for documentation
COMMENT ON COLUMN public.profiles.address IS 'Physical address for agents, managers, and business partners';
COMMENT ON COLUMN public.profiles.created_by IS 'UUID of the user who created this profile (admin/manager/business_partner)';
COMMENT ON COLUMN public.profiles.reset_token IS 'Token for password reset functionality';
COMMENT ON COLUMN public.profiles.reset_token_expires IS 'Expiration timestamp for reset token';

-- Step 8: Ensure employee_id sequence and function exist
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
  employee_id TEXT;
BEGIN
  next_id := nextval('employee_id_seq');
  employee_id := 'SWI' || LPAD(next_id::TEXT, 3, '0');
  RETURN employee_id;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update handle_new_user trigger function to support business_partner and address
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_email TEXT;
  user_role TEXT;
  user_address TEXT;
  new_employee_id TEXT;
BEGIN
  -- Extract metadata with proper defaults
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  user_email := COALESCE(NEW.email, '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'visitor');
  user_address := COALESCE(NEW.raw_user_meta_data->>'address', NULL);
  
  -- Validate role (including business_partner)
  IF user_role NOT IN ('visitor', 'owner', 'agent', 'manager', 'admin', 'business_partner') THEN
    user_role := 'visitor';
  END IF;
  
  -- Generate employee_id for agents, managers, and business partners
  IF user_role IN ('agent', 'manager', 'business_partner') THEN
    new_employee_id := generate_employee_id();
    RAISE NOTICE 'Generated employee ID % for new % %', new_employee_id, user_role, user_name;
  ELSE
    new_employee_id := NULL;
  END IF;
  
  -- Insert into profiles with all fields including address
  INSERT INTO public.profiles (id, name, phone, email, role, address, enable_2fa, password_hash, employee_id)
  VALUES (
    NEW.id,
    user_name,
    user_phone,
    user_email,
    user_role,
    user_address,
    FALSE,
    NULL,  -- Password will be updated separately via API
    new_employee_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists (shouldn't happen but handle gracefully)
    RAISE WARNING 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log detailed error
    RAISE WARNING 'Error in handle_new_user trigger for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RAISE; -- Re-raise to prevent user creation if profile creation fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new auth user is created. Supports all roles including business_partner. Extracts user metadata including address.';
