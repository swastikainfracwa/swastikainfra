-- Fix the handle_new_user() trigger to properly handle all columns including new ones

-- Drop and recreate the trigger function with better handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Extract metadata with proper defaults
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  user_email := COALESCE(NEW.email, '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'visitor');
  
  -- Insert into profiles (employee_id will be set by trigger_set_employee_id if role is agent/manager)
  INSERT INTO public.profiles (id, name, phone, email, role, enable_2fa, password)
  VALUES (
    NEW.id,
    user_name,
    user_phone,
    user_email,
    user_role,
    FALSE,
    NULL  -- Password will be updated separately via API
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise for debugging
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new auth user is created. Extracts user metadata from auth.users and populates the profiles table.';
