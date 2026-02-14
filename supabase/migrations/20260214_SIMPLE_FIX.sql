-- ===========================================================================
-- SIMPLE STEP-BY-STEP FIX - RUN THIS FIRST
-- Each step is safe to run multiple times
-- ===========================================================================

-- STEP 1: Ensure password_hash column exists
-- ---------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
    RAISE NOTICE '✓ Added password_hash column';
  ELSE
    RAISE NOTICE '✓ password_hash column already exists';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_password_hash_idx ON public.profiles(password_hash) WHERE password_hash IS NOT NULL;

-- STEP 2: Ensure employee_id column exists
-- ---------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN employee_id TEXT;
    RAISE NOTICE '✓ Added employee_id column';
  ELSE
    RAISE NOTICE '✓ employee_id column already exists';
  END IF;
END $$;

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_employee_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_employee_id_key UNIQUE (employee_id);
    RAISE NOTICE '✓ Added unique constraint on employee_id';
  ELSE
    RAISE NOTICE '✓ Unique constraint already exists';
  END IF;
END $$;

-- STEP 3: Create sequence and function
-- ---------------------------------------------------------------------------
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

DO $$ BEGIN RAISE NOTICE '✓ Employee ID generation function created'; END $$;

-- STEP 4: Drop old triggers to start fresh
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_set_employee_id ON public.profiles;

DO $$ BEGIN RAISE NOTICE '✓ Old triggers removed'; END $$;

-- STEP 5: Create simple, reliable trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_email TEXT;
  user_role TEXT;
  new_emp_id TEXT := NULL;
BEGIN
  -- Extract user data
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  user_email := COALESCE(NEW.email, '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'visitor');
  
  -- Validate role
  IF user_role NOT IN ('visitor', 'owner', 'agent', 'manager', 'admin') THEN
    user_role := 'visitor';
  END IF;
  
  -- Generate employee ID for agents and managers
  IF user_role IN ('agent', 'manager') THEN
    BEGIN
      new_emp_id := generate_employee_id();
      RAISE NOTICE 'Generated employee ID % for % (%)', new_emp_id, user_name, user_role;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to generate employee ID: %', SQLERRM;
      new_emp_id := NULL;
    END;
  END IF;
  
  -- Insert profile
  BEGIN
    INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password_hash, employee_id)
    VALUES (NEW.id, user_name, user_phone, user_email, user_role, FALSE, NULL, new_emp_id);
    
    RAISE NOTICE 'Profile created for % (role: %)', user_name, user_role;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE WARNING 'Profile already exists for user %', NEW.id;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$ BEGIN RAISE NOTICE '✓ User creation trigger installed'; END $$;

-- STEP 6: Create backup trigger for direct inserts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('agent', 'manager') AND NEW.employee_id IS NULL THEN
    BEGIN
      NEW.employee_id := generate_employee_id();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backup trigger failed to generate employee ID: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_employee_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_employee_id();

DO $$ BEGIN RAISE NOTICE '✓ Backup trigger installed'; END $$;

-- STEP 7: Assign IDs to existing agents/managers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  profile_record RECORD;
  new_emp_id TEXT;
  count INTEGER := 0;
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
    
    count := count + 1;
    RAISE NOTICE 'Assigned % to % (%)', new_emp_id, profile_record.name, profile_record.role;
  END LOOP;
  
  IF count > 0 THEN
    RAISE NOTICE '✓ Assigned employee IDs to % existing users', count;
  ELSE
    RAISE NOTICE '✓ No existing users need employee IDs';
  END IF;
END $$;

-- STEP 8: Fix plot size units
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  count INTEGER;
BEGIN
  -- Update sqyd to sqft
  UPDATE properties 
  SET plot_size_unit = 'sqft', plot_size = plot_size * 9
  WHERE plot_size_unit = 'sqyd';
  
  GET DIAGNOSTICS count = ROW_COUNT;
  IF count > 0 THEN
    RAISE NOTICE '✓ Converted % properties from sq yd to sq ft', count;
  END IF;
  
  -- Drop old constraint
  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_plot_size_unit_check;
  
  -- Add new constraint
  ALTER TABLE properties 
    ADD CONSTRAINT properties_plot_size_unit_check 
    CHECK (plot_size_unit IN ('sqft', 'acre'));
  
  RAISE NOTICE '✓ Plot size units updated (sqft and acre only)';
END $$;

-- STEP 9: Final verification
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  trigger_count INTEGER;
  column_count INTEGER;
BEGIN
  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name IN ('on_auth_user_created', 'trigger_set_employee_id');
  
  -- Check columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'profiles' 
    AND column_name IN ('employee_id', 'password_hash');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ SETUP COMPLETE ✓✓✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers installed: % of 2', trigger_count;
  RAISE NOTICE 'Required columns: % of 2', column_count;
  RAISE NOTICE '';
  
  IF trigger_count = 2 AND column_count = 2 THEN
    RAISE NOTICE '✓ All checks passed!';
    RAISE NOTICE '✓ You can now create users from admin dashboard';
    RAISE NOTICE '✓ Agents and managers will get employee IDs automatically';
  ELSE
    RAISE WARNING '⚠ Some components missing - please check errors above';
  END IF;
  
  RAISE NOTICE '';
END $$;
