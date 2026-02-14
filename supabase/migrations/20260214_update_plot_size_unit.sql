-- Update plot_size_unit constraint to only allow 'sqft' and 'acre'

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
