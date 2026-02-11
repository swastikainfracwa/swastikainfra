-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extends auth.users with additional user information
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('visitor', 'owner', 'agent', 'manager', 'admin')),
  enable_2fa BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- PROPERTIES TABLE
-- Stores all property listings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  plot_size DECIMAL(10, 2) NOT NULL,
  plot_size_unit TEXT NOT NULL CHECK (plot_size_unit IN ('sqyd', 'sqft', 'acre')),
  property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'agricultural', 'industrial')),
  images TEXT[] DEFAULT '{}',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_badge TEXT CHECK (verification_badge IN ('verified-agent', 'verified-manager', NULL)),
  is_featured BOOLEAN DEFAULT FALSE,
  seo_slug TEXT NOT NULL UNIQUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_seo_slug_idx ON public.properties(seo_slug);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS properties_verification_status_idx ON public.properties(verification_status);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties(created_at DESC);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Anyone can view verified properties"
  ON public.properties FOR SELECT
  USING (verification_status = 'verified');

CREATE POLICY "Owners can view own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Managers and admins can view all properties"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'agent', 'manager', 'admin')
    )
  );

CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Managers and admins can update verification status"
  ON public.properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- LEADS TABLE
-- Stores inquiries from potential buyers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  property_title TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS leads_property_id_idx ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Anyone can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property owners can view leads for their properties"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = leads.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can view all leads"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- FUNCTIONS
-- Auto-update timestamps and sync owner data
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync owner data from profiles to properties
CREATE OR REPLACE FUNCTION public.sync_property_owner_data()
RETURNS TRIGGER AS $$
BEGIN
  -- If owner_id is set or changed, update owner_name and owner_phone
  IF NEW.owner_id IS NOT NULL THEN
    SELECT name, phone INTO NEW.owner_name, NEW.owner_phone
    FROM public.profiles
    WHERE id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment property views
CREATE OR REPLACE FUNCTION public.increment_property_views(property_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.properties
  SET views = views + 1
  WHERE seo_slug = property_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps and sync data
-- ============================================================================

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for properties updated_at
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to sync owner data when property is inserted or owner_id changes
CREATE TRIGGER properties_sync_owner_data
  BEFORE INSERT OR UPDATE OF owner_id ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_property_owner_data();

-- ============================================================================
-- INITIAL SETUP FUNCTION
-- Called after signup to create user profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- Allow authenticated users to access public schema
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Allow anon users to read verified properties and create leads
GRANT SELECT ON public.properties TO anon;
GRANT INSERT ON public.leads TO anon;
