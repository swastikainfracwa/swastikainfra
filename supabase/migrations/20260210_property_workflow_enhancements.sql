-- Property Workflow Enhancements Migration
-- Date: 2026-02-10
-- Description: Add columns for staff-created properties and document tracking

-- Add new columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_staff_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_upload_completed BOOLEAN DEFAULT FALSE;

-- Add comments for clarity
COMMENT ON COLUMN properties.is_staff_created IS 'True if property was created by Admin/Manager/Agent (pre-verified)';
COMMENT ON COLUMN properties.document_upload_completed IS 'True when agent has uploaded all required documents';

-- Update RLS policies for properties table to support new workflow

-- Policy: Agents can mark document upload as complete on their assigned properties
DROP POLICY IF EXISTS "agents_update_assigned_properties" ON properties;
CREATE POLICY "agents_update_assigned_properties" ON properties
  FOR UPDATE USING (
    assigned_agent_id = auth.uid()
  )
  WITH CHECK (
    assigned_agent_id = auth.uid()
  );

-- Policy: Staff (Admin/Manager/Agent) can create pre-verified properties
DROP POLICY IF EXISTS "staff_create_verified_properties" ON properties;
CREATE POLICY "staff_create_verified_properties" ON properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- Storage bucket setup for property documents
-- Note: This SQL creates the bucket and policies. Must be run by admin/service role.

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Policy: Owners and agents can upload documents
DROP POLICY IF EXISTS "property_documents_upload" ON storage.objects;
CREATE POLICY "property_documents_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents'
    AND (
      -- User is the property owner
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
      )
      OR
      -- User is the assigned agent
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND assigned_agent_id = auth.uid()
      )
      OR
      -- User is staff (admin/manager)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
      )
    )
  );

-- Policy: Authenticated users can view documents for properties they have access to
DROP POLICY IF EXISTS "property_documents_view" ON storage.objects;
CREATE POLICY "property_documents_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents'
    AND (
      -- Property owner
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
      )
      OR
      -- Assigned agent
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND assigned_agent_id = auth.uid()
      )
      OR
      -- Staff (admin/manager/any agent)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'agent')
      )
    )
  );

-- Policy: Owners, agents, and managers can delete documents
DROP POLICY IF EXISTS "property_documents_delete" ON storage.objects;
CREATE POLICY "property_documents_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-documents'
    AND (
      -- Property owner
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
      )
      OR
      -- Assigned agent
      EXISTS (
        SELECT 1 FROM properties
        WHERE id::text = (storage.foldername(name))[1]
        AND assigned_agent_id = auth.uid()
      )
      OR
      -- Staff (admin/manager)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
      )
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_staff_created ON properties(is_staff_created);
CREATE INDEX IF NOT EXISTS idx_properties_document_completed ON properties(document_upload_completed);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent ON properties(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_verification_status ON properties(verification_status);

-- Update existing property_documents table RLS policies
DROP POLICY IF EXISTS "property_documents_agent_upload" ON property_documents;
CREATE POLICY "property_documents_agent_upload" ON property_documents
  FOR INSERT WITH CHECK (
    -- User is assigned agent or property owner
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_documents.property_id
      AND (assigned_agent_id = auth.uid() OR owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "property_documents_staff_view" ON property_documents;
CREATE POLICY "property_documents_staff_view" ON property_documents
  FOR SELECT USING (
    -- User is owner, assigned agent, or staff
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_documents.property_id
      AND (
        owner_id = auth.uid()
        OR assigned_agent_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "property_documents_delete_access" ON property_documents;
CREATE POLICY "property_documents_delete_access" ON property_documents
  FOR DELETE USING (
    -- User is assigned agent or admin/manager
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_documents.property_id
      AND assigned_agent_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
