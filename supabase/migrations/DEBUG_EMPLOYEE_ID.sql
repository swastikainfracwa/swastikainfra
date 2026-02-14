-- ===========================================================================
-- DEBUG: Test Employee ID Generation
-- Run this to see what's happening
-- ===========================================================================

-- Test 1: Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'trigger_set_employee_id')
ORDER BY trigger_name;

-- Test 2: Check sequence status
SELECT last_value, is_called FROM employee_id_seq;

-- Test 3: Test the function directly
SELECT generate_employee_id() as test_id_1;
SELECT generate_employee_id() as test_id_2;

-- Test 4: Check auth.users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Test 5: Check most recent auth users and their profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role,
  p.name,
  p.role as profile_role,
  p.employee_id,
  p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;

-- Test 6: Try direct insert to profiles (this should trigger set_employee_id)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  result_emp_id TEXT;
BEGIN
  -- Insert test profile
  INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password_hash)
  VALUES (test_id, 'Test Direct Agent', '9999999999', 
          'testdirect_' || test_id::text || '@test.com', 'agent', FALSE, NULL)
  RETURNING employee_id INTO result_emp_id;
  
  IF result_emp_id IS NOT NULL THEN
    RAISE NOTICE '✓ Direct insert test PASSED - Employee ID: %', result_emp_id;
  ELSE
    RAISE WARNING '✗ Direct insert test FAILED - employee_id is NULL';
  END IF;
  
  -- Cleanup
  DELETE FROM public.profiles WHERE id = test_id;
  RAISE NOTICE 'Test data cleaned up';
END $$;

-- Test 7: Check trigger function source
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
