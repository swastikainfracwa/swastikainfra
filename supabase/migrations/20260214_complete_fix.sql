-- ===========================================================================
-- COMPLETE FIX FOR USER CREATION AND PLOT SIZE UPDATES
-- Run this entire script in Supabase SQL Editor
-- ===========================================================================

-- PART 1: Fix plot_size_unit constraint
-- ---------------------------------------------------------------------------

-- Step 1: Update existing 'sqyd' entries to 'sqft' FIRST (1 sq yd = 9 sq ft)
UPDATE properties 
SET 
  plot_size_unit = 'sqft',
  plot_size = plot_size * 9
WHERE plot_size_unit = 'sqyd';

-- Step 2: Drop the existing check constraint
ALTER TABLE properties 
  DROP CONSTRAINT IF EXISTS properties_plot_size_unit_check;

-- Step 3: Add new check constraint with only 'sqft' and 'acre'
ALTER TABLE properties 
  ADD CONSTRAINT properties_plot_size_unit_check 
  CHECK (plot_size_unit IN ('sqft', 'acre'));

-- Update comment to reflect the change
COMMENT ON COLUMN properties.plot_size_unit IS 'Unit of measurement for plot size. Valid values: sqft (square feet), acre (acres)';

-- PART 2: Ensure password_hash column exists
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
COMMENT ON COLUMN profiles.password_hash IS 'Hashed password for NextAuth credentials authentication';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_password_hash_idx ON public.profiles(password_hash) WHERE password_hash IS NOT NULL;

-- PART 3: Ensure employee_id infrastructure exists
-- ---------------------------------------------------------------------------

-- Add employee_id column if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Create unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_employee_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_employee_id_key UNIQUE (employee_id);
    END IF;
END $$;

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

-- Function to generate employee ID with SWI prefix
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

-- PART 4: Assign employee IDs to existing agents and managers
-- ---------------------------------------------------------------------------

-- Update all existing agents and managers who don't have employee_id
DO $$
DECLARE
  profile_record RECORD;
  new_emp_id TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, role, name 
    FROM public.profiles 
    WHERE role IN ('agent', 'manager') 
    AND (employee_id IS NULL OR employee_id = '')
    ORDER BY created_at
  LOOP
    new_emp_id := generate_employee_id();
    UPDATE public.profiles 
    SET employee_id = new_emp_id 
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Assigned employee ID % to % (%)', new_emp_id, profile_record.name, profile_record.role;
  END LOOP;
END $$;

-- PART 5: Fix the employee_id trigger (backup for direct inserts)
-- ---------------------------------------------------------------------------

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_employee_id ON public.profiles;

-- Recreate the trigger function as a backup for direct profile inserts
-- (The handle_new_user function now handles this for auth user creation)
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('agent', 'manager') AND NEW.employee_id IS NULL THEN
    NEW.employee_id := generate_employee_id();
    RAISE NOTICE 'Backup trigger: Generated employee ID % for %', NEW.employee_id, NEW.name;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in set_employee_id trigger: %', SQLERRM;
    RETURN NEW; -- Continue even if employee_id fails
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_set_employee_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_employee_id();

-- PART 6: Fix the user creation trigger
-- ---------------------------------------------------------------------------

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with comprehensive error handling AND employee_id generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_email TEXT;
  user_role TEXT;
  new_employee_id TEXT;
BEGIN
  -- Extract metadata with proper defaults
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  user_email := COALESCE(NEW.email, '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'visitor');
  
  -- Validate role
  IF user_role NOT IN ('visitor', 'owner', 'agent', 'manager', 'admin') THEN
    user_role := 'visitor';
  END IF;
  
  -- Generate employee_id for agents and managers
  IF user_role IN ('agent', 'manager') THEN
    new_employee_id := generate_employee_id();
    RAISE NOTICE 'Generated employee ID % for new % %', new_employee_id, user_role, user_name;
  ELSE
    new_employee_id := NULL;
  END IF;
  
  -- Insert into profiles with employee_id already set
  INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password_hash, employee_id)
  VALUES (
    NEW.id,
    user_name,
    user_phone,
    user_email,
    user_role,
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

-- PART 7: Add helpful comments
-- ---------------------------------------------------------------------------

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new auth user is created. Extracts user metadata and handles errors gracefully.';
COMMENT ON FUNCTION set_employee_id() IS 'Automatically generates employee ID (SWI001, SWI002, etc.) for agents and managers.';
COMMENT ON FUNCTION generate_employee_id() IS 'Generates sequential employee IDs with SWI prefix.';

-- PART 8: Verification queries (check output in Results tab)
-- ---------------------------------------------------------------------------

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'trigger_set_employee_id')
ORDER BY trigger_name;

-- Check if columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('employee_id', 'password_hash')
ORDER BY column_name;

-- Check plot_size_unit constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'properties_plot_size_unit_check';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ All migrations applied successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Plot size units updated (sqft and acre only)';
  RAISE NOTICE '✓ Password_hash column configured';
  RAISE NOTICE '✓ Employee ID infrastructure set up';
  RAISE NOTICE '✓ Existing agents/managers assigned employee IDs';
  RAISE NOTICE '✓ User creation trigger FIXED to generate employee IDs';
  RAISE NOTICE '✓ Backup trigger added for direct profile inserts';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Go to your admin dashboard';
  RAISE NOTICE '2. Create a new agent or manager';
  RAISE NOTICE '3. Employee ID (SWI001, SWI002, etc.) should appear automatically';
  RAISE NOTICE '4. If you still see N/A, check the Messages tab above for any errors';
  RAISE NOTICE '';
END $$;

-- PART 9: Test the employee_id generation (Optional - can be commented out)
-- ---------------------------------------------------------------------------

-- Uncomment below to test if employee_id trigger works
/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Test insert (will be rolled back)
  INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password_hash)
  VALUES (
    test_user_id,
    'Test Agent',
    '1234567890',
    'testagent@test.com',
    'agent',
    FALSE,
    NULL
  );
  
  -- Check if employee_id was generated
  DECLARE
    generated_emp_id TEXT;
  BEGIN
    SELECT employee_id INTO generated_emp_id
    FROM public.profiles
    WHERE id = test_user_id;
    
    IF generated_emp_id IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS: Employee ID generation is working! Generated: %', generated_emp_id;
    ELSE
      RAISE WARNING 'FAILED: Employee ID was not generated for test agent';
    END IF;
  END;
  
  -- Rollback test data
  DELETE FROM public.profiles WHERE id = test_user_id;
  RAISE NOTICE 'Test data cleaned up';
END $$;
*/

