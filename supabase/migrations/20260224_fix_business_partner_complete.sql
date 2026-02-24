-- Complete fix for business partner functionality
-- Run this entire script in Supabase SQL Editor

-- STEP 1: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;

    -- Add created_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add reset_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'reset_token'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN reset_token TEXT;
    END IF;

    -- Add reset_token_expires column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'reset_token_expires'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN reset_token_expires TIMESTAMPTZ;
    END IF;
END $$;

-- STEP 2: Update role constraint to include business_partner
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('visitor', 'owner', 'agent', 'manager', 'admin', 'business_partner'));

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON public.profiles(reset_token);

-- STEP 4: Ensure employee_id sequence exists
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

-- STEP 5: Create/Update generate_employee_id function
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

-- STEP 6: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 7: Create new handle_new_user function with business_partner support
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
    BEGIN
      new_employee_id := generate_employee_id();
      RAISE NOTICE 'Generated employee ID % for new % %', new_employee_id, user_role, user_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to generate employee_id: %', SQLERRM;
      new_employee_id := NULL;
    END;
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
  
  RAISE NOTICE 'Profile created for user % with role % and employee_id %', user_name, user_role, new_employee_id;
  
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

-- STEP 8: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 9: Test the function works
DO $$
DECLARE
  test_id TEXT;
BEGIN
  test_id := generate_employee_id();
  RAISE NOTICE '✅ Test employee ID generated successfully: %', test_id;
END;
$$;

-- STEP 10: Verify columns exist
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! Verifying columns...';
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    RAISE NOTICE '  ✓ address column exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_by') THEN
    RAISE NOTICE '  ✓ created_by column exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reset_token') THEN
    RAISE NOTICE '  ✓ reset_token column exists';
  END IF;
  
  RAISE NOTICE '✅ All checks passed!';
END;
$$;
