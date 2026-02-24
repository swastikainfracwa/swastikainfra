-- Hotfix: Ensure generate_employee_id function and sequence exist
-- This fixes the "Database error creating new user" issue

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

-- Create or update the generate_employee_id function
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

-- Verify the function works
DO $$
DECLARE
  test_id TEXT;
BEGIN
  test_id := generate_employee_id();
  RAISE NOTICE 'Test employee ID generated: %', test_id;
END;
$$;
