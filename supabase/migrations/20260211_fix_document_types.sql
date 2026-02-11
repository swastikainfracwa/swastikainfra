-- Fix document type constraint to match application types
-- Update the check constraint to allow proper document types

-- Drop the old constraint
ALTER TABLE public.property_documents 
DROP CONSTRAINT IF EXISTS property_documents_document_type_check;

-- Add new constraint with correct document types
ALTER TABLE public.property_documents 
ADD CONSTRAINT property_documents_document_type_check 
CHECK (document_type IN (
  'owner_national_id',
  'property_registration', 
  'property_photo'
));

-- Add comment for documentation
COMMENT ON COLUMN public.property_documents.document_type IS 
'Type of document: owner_national_id (owner ID proof), property_registration (title/registration docs), property_photo (property images)';
