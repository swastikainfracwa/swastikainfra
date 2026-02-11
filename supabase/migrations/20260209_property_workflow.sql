-- Property Verification Workflow Schema
-- Adds fields and tables for agent assignment and document uploads

-- Add new columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS properties_assigned_agent_id_idx ON public.properties(assigned_agent_id);
CREATE INDEX IF NOT EXISTS properties_status_agent_idx ON public.properties(verification_status, assigned_agent_id);

-- ============================================================================
-- PROPERTY_DOCUMENTS TABLE
-- Stores uploaded verification documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('owner_id', 'plot_registration')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS property_documents_property_id_idx ON public.property_documents(property_id);
CREATE INDEX IF NOT EXISTS property_documents_uploaded_by_idx ON public.property_documents(uploaded_by);

-- Enable RLS
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Property owners can view their property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Assigned agents can view property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Managers and admins can view all documents" ON public.property_documents;
DROP POLICY IF EXISTS "Assigned agents can upload documents" ON public.property_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.property_documents;
DROP POLICY IF EXISTS "Agents can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Managers can assign properties to agents" ON public.properties;

-- RLS Policies for property_documents
CREATE POLICY "Property owners can view their property documents"
  ON public.property_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_documents.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Assigned agents can view property documents"
  ON public.property_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_documents.property_id
      AND properties.assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can view all documents"
  ON public.property_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Assigned agents can upload documents"
  ON public.property_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.properties p
      INNER JOIN public.profiles prof ON prof.id = auth.uid()
      WHERE p.id = property_documents.property_id
      AND p.assigned_agent_id = auth.uid()
      AND prof.role = 'agent'
    )
  );

CREATE POLICY "Admins can delete documents"
  ON public.property_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- UPDATE RLS POLICIES FOR PROPERTIES
-- Add policies for agent access
-- ============================================================================

-- Agents can view properties assigned to them
CREATE POLICY "Agents can view assigned properties"
  ON public.properties FOR SELECT
  USING (
    auth.uid() = assigned_agent_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

-- Agents can update properties assigned to them (for document submission)
CREATE POLICY "Agents can update assigned properties"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() = assigned_agent_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  )
  WITH CHECK (
    auth.uid() = assigned_agent_id
  );

-- Managers can assign properties to agents
CREATE POLICY "Managers can assign properties to agents"
  ON public.properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_documents TO authenticated;
