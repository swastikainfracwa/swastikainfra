import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type - allow images for photos and PDFs for documents
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
    const isPDF = ALLOWED_DOCUMENT_TYPES.includes(file.type.toLowerCase());
    
    if (!isImage && !isPDF) {
      return NextResponse.json({ error: 'Invalid file type. Only images (JPG, JPEG, PNG, GIF, WebP) and PDF allowed' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get property by slug or ID
    const { data: property, error: propertyError } = await adminSupabase
      .from('properties')
      .select('id, owner_id, assigned_agent_id')
      .or(`id.eq.${slug},seo_slug.eq.${slug}`)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Check if user has permission to upload (owner, assigned agent, or staff)
    const isOwner = property.owner_id === userId;
    const isAssignedAgent = property.assigned_agent_id === userId;
    const isStaff = ['admin', 'manager'].includes(userRole);

    if (!isOwner && !isAssignedAgent && !isStaff) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to upload documents for this property' }, { status: 403 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${property.id}/${documentType}_${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('property-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        fileName: fileName,
        fileType: file.type,
        fileSize: file.size,
      });
      return NextResponse.json({ 
        error: `Failed to upload file: ${uploadError.message}`,
        details: uploadError 
      }, { status: 500 });
    }

    if (!uploadData) {
      console.error('No upload data returned');
      return NextResponse.json({ error: 'Upload failed - no data returned' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = adminSupabase
      .storage
      .from('property-documents')
      .getPublicUrl(fileName);

    // Save document metadata to database
    const { data: document, error: dbError } = await adminSupabase
      .from('property_documents')
      .insert({
        property_id: property.id,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete the uploaded file
      await adminSupabase.storage.from('property-documents').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        propertyId: document.property_id,
        documentType: document.document_type,
        fileUrl: document.file_url,
        fileName: document.file_name,
        fileSize: document.file_size,
        uploadedBy: document.uploaded_by,
        createdAt: document.created_at,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Document upload error:', {
      error,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const adminSupabase = createAdminClient();

    // Get property by slug or ID
    const { data: property, error: propertyError } = await adminSupabase
      .from('properties')
      .select('id, owner_id, assigned_agent_id')
      .or(`id.eq.${slug},seo_slug.eq.${slug}`)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Check if user has permission to view documents
    const isOwner = property.owner_id === userId;
    const isAssignedAgent = property.assigned_agent_id === userId;
    const isStaff = ['admin', 'manager', 'agent'].includes(userRole);

    if (!isOwner && !isAssignedAgent && !isStaff) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view documents for this property' }, { status: 403 });
    }

    // Get all documents for the property
    const { data: documents, error: documentsError } = await adminSupabase
      .from('property_documents')
      .select(`
        id,
        property_id,
        document_type,
        file_url,
        file_name,
        file_size,
        uploaded_by,
        created_at,
        profiles:uploaded_by (name)
      `)
      .eq('property_id', property.id)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Documents fetch error:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      propertyId: doc.property_id,
      documentType: doc.document_type,
      fileUrl: doc.file_url,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      uploadedBy: doc.uploaded_by,
      uploadedByName: (doc.profiles as any)?.name,
      createdAt: doc.created_at,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
    });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
