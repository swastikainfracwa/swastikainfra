-- Add employee_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN employee_id TEXT UNIQUE;

-- Add location coordinates to properties table
ALTER TABLE public.properties
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN youtube_video_url TEXT;

-- Create sequence for employee ID
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

-- Trigger to auto-generate employee_id for agents and managers
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('agent', 'manager') AND NEW.employee_id IS NULL THEN
    NEW.employee_id := generate_employee_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_employee_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_employee_id();

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.employee_id IS 'Auto-generated employee ID for agents and managers (format: SWI001, SWI002, etc.)';
COMMENT ON COLUMN public.properties.latitude IS 'Property latitude coordinate for map display and proximity search';
COMMENT ON COLUMN public.properties.longitude IS 'Property longitude coordinate for map display and proximity search';
COMMENT ON COLUMN public.properties.youtube_video_url IS 'Optional YouTube video URL for property showcase';
