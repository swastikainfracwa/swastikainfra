-- ===========================================================================
-- ADD RPC WRAPPER FOR generate_employee_id
-- This allows the API to call the function directly if trigger fails
-- ===========================================================================

-- Make generate_employee_id callable via RPC
-- (Already defined, just ensuring proper permissions)

GRANT EXECUTE ON FUNCTION generate_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_employee_id() TO service_role;

-- Create a test to verify RPC works
SELECT generate_employee_id() as rpc_test;

-- Success
DO $$
BEGIN
  RAISE NOTICE '✓ RPC access granted to generate_employee_id';
  RAISE NOTICE 'The API can now call this function directly if needed';
END $$;
