-- Create function to get nearby properties using Haversine formula
-- This provides better performance than client-side calculation
CREATE OR REPLACE FUNCTION get_nearby_properties(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL,
  location TEXT,
  city TEXT,
  state TEXT,
  plot_size DECIMAL,
  plot_size_unit TEXT,
  property_type TEXT,
  images TEXT[],
  youtube_video_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  owner_id UUID,
  owner_name TEXT,
  owner_phone TEXT,
  verification_status TEXT,
  verification_badge TEXT,
  is_featured BOOLEAN,
  is_staff_created BOOLEAN,
  document_upload_completed BOOLEAN,
  assigned_agent_id UUID,
  seo_slug TEXT,
  views INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.*,
    ROUND(
      CAST(
        6371 * acos(
          cos(radians(user_lat)) * 
          cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(p.latitude))
        ) AS DECIMAL
      ), 1
    ) AS distance
  FROM properties p
  WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.verification_status = 'verified'
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.latitude))
      )
    ) <= radius_km
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_nearby_properties IS 'Returns properties within specified radius (km) from given coordinates, sorted by distance';
