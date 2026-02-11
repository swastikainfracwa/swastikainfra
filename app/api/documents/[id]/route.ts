import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const adminSupabase = createAdminClient();
    const { id } = await params;

    // Get document details
    const { data: document, error: docError } = await adminSupabase
      .from('property_documents')
      .select(`
        id,
        property_id,
        file_url,
        uploaded_by,
        properties:property_id (owner_id, assigned_agent_id)
      `)
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const property = (document.properties as any);
    
    // Check permissions: uploaded by user, assigned agent, or staff
    const canDelete = 
      document.uploaded_by === userId ||
      property.assigned_agent_id === userId ||
      ['admin', 'manager'].includes(userRole);

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this document' }, { status: 403 });
    }

    // Extract file path from URL
    const fileUrl = document.file_url;
    const filePath = fileUrl.split('/property-documents/')[1];

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // Delete from storage
    const { error: storageError } = await adminSupabase
      .storage
      .from('property-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete from database even if storage delete fails
    }

    // Delete from database
    const { error: deleteError } = await adminSupabase
      .from('property_documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const adminSupabase = createAdminClient();
    const { id } = await params;

    // Get document with property details
    const { data: document, error: docError } = await adminSupabase
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
        properties:property_id (owner_id, assigned_agent_id)
      `)
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const property = (document.properties as any);

    // Check permissions
    const canView =
      property.owner_id === userId ||
      property.assigned_agent_id === userId ||
      ['admin', 'manager', 'agent'].includes(userRole);

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this document' }, { status: 403 });
    }

    // Generate signed URL for secure access (valid for 1 hour)
    const filePath = document.file_url.split('/property-documents/')[1];
    
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase
      .storage
      .from('property-documents')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json({ error: 'Failed to generate secure URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        propertyId: document.property_id,
        documentType: document.document_type,
        fileName: document.file_name,
        fileSize: document.file_size,
        uploadedBy: document.uploaded_by,
        createdAt: document.created_at,
        signedUrl: signedUrlData.signedUrl,
      },
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
