-- ===========================================================================
-- QUICK TEST: Verify Employee ID Generation is Working
-- Run this AFTER running 20260214_complete_fix.sql
-- ===========================================================================

-- Step 1: Check if the trigger function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'generate_employee_id', 'set_employee_id')
ORDER BY routine_name;

-- Expected output: 3 rows showing the functions exist

-- Step 2: Check if triggers are active
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'trigger_set_employee_id')
ORDER BY trigger_name;

-- Expected output: 2 rows showing both triggers

-- Step 3: Test employee ID generation directly
DO $$
DECLARE
  test_emp_id TEXT;
BEGIN
  -- Generate a test ID
  test_emp_id := generate_employee_id();
  RAISE NOTICE 'Test: Generated employee ID: %', test_emp_id;
  
  -- This should show something like SWI001, SWI002, etc.
END $$;

-- Step 4: Check existing agents/managers have employee IDs
SELECT 
  name,
  role,
  employee_id,
  CASE 
    WHEN employee_id IS NULL THEN '❌ MISSING'
    ELSE '✓ Has ID'
  END as status,
  created_at
FROM profiles
WHERE role IN ('agent', 'manager')
ORDER BY created_at;

-- Expected: All agents and managers should have employee_id values

-- Step 5: Check sequence status
SELECT 
  last_value as next_employee_number,
  'Next ID will be: SWI' || LPAD((last_value + 1)::TEXT, 3, '0') as next_employee_id
FROM employee_id_seq;

-- This shows what the next employee ID will be

-- ===========================================================================
-- OPTIONAL: Test with a temporary profile (will be deleted)
-- ===========================================================================
-- Uncomment the block below to test profile creation with employee_id

/*
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_emp_id TEXT;
BEGIN
  -- Insert a test agent
  INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password_hash)
  VALUES (
    test_id,
    'Test Agent AutoGen',
    '9999999999',
    'test_autogen_' || test_id::text || '@example.com',
    'agent',
    FALSE,
    NULL
  )
  RETURNING employee_id INTO test_emp_id;
  
  -- Check result
  IF test_emp_id IS NOT NULL THEN
    RAISE NOTICE '✓ SUCCESS: Profile created with employee ID: %', test_emp_id;
  ELSE
    RAISE WARNING '❌ FAILED: Profile created but employee_id is NULL';
  END IF;
  
  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_id;
  RAISE NOTICE 'Test profile cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Test failed with error: %', SQLERRM;
    -- Try to clean up
    DELETE FROM public.profiles WHERE id = test_id;
END $$;
*/

-- ===========================================================================
-- SUMMARY
-- ===========================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the Results tab above:';
  RAISE NOTICE '1. Functions should exist (3 rows)';
  RAISE NOTICE '2. Triggers should be active (2 rows)';
  RAISE NOTICE '3. Test ID generation should show SWI00X format';
  RAISE NOTICE '4. All agents/managers should have employee IDs';
  RAISE NOTICE '5. Sequence should show next ID number';
  RAISE NOTICE '';
  RAISE NOTICE 'If all checks passed, employee ID generation is working!';
  RAISE NOTICE 'Try creating a new agent/manager from admin dashboard.';
  RAISE NOTICE '';
END $$;
