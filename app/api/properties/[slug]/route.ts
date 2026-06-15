import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get session for authorization check
    const session = await auth();
    const userRole = session?.user ? (session.user as any).role : null;
    const userId = session?.user?.id;
    
    // Use admin client to bypass RLS
    const supabase = await createAdminClient();

    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .or(`id.eq.${slug},seo_slug.eq.${slug}`)
      .single();

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Authorization: Only show verified properties to public, or owner's own properties, or staff
    const isOwner = userId === property.owner_id;
    const isStaff = ['admin', 'manager', 'agent'].includes(userRole || '');
    const isVerified = property.verification_status === 'verified';

    if (!isVerified && !isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Increment views
    await supabase
      .from('properties')
      .update({ views: property.views + 1 })
      .eq('id', property.id);

    // Transform database response to match Property interface
    const transformedProperty = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      location: property.location,
      city: property.city,
      state: property.state,
      plotSize: property.plot_size,
      plotSizeUnit: property.plot_size_unit,
      propertyType: property.property_type,
      images: property.images,
      ownerId: property.owner_id,
      ownerName: property.owner_name,
      ownerPhone: property.owner_phone,
      verificationStatus: property.verification_status,
      verificationBadge: property.verification_badge,
      isFeatured: property.is_featured,
      isStaffCreated: property.is_staff_created,
      documentUploadCompleted: property.document_upload_completed,
      assignedAgentId: property.assigned_agent_id,
      seoSlug: property.seo_slug,
      views: property.views + 1, // Include incremented views
      createdAt: new Date(property.created_at),
      updatedAt: new Date(property.updated_at),
    };

    return NextResponse.json({ property: transformedProperty });
  } catch (error) {
    console.error('Property GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const userRole = (session.user as any).role;

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get the property first to check ownership
    const { data: property, error: fetchError } = await adminClient
      .from('properties')
      .select('*')
      .or(`id.eq.${slug},seo_slug.eq.${slug}`)
      .single();

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Authorization checks
    const isOwner = property.owner_id === session.user.id;
    const isAgent = userRole === 'agent' && property.assigned_agent_id === session.user.id;
    const isManager = userRole === 'manager' || userRole === 'admin';

    if (!isOwner && !isAgent && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update fields based on role
    const updates: any = {};

    // Only managers/admins can update verification status and assign agents
    if (isManager) {
      if (body.verificationStatus !== undefined) {
        if (body.verificationStatus === 'assigned') {
          // Agent assignment is tracked separately through assigned_agent_id.
        } else {
          updates.verification_status = body.verificationStatus;
          if (body.verificationStatus === 'verified') {
            updates.verified_at = new Date().toISOString();
            updates.verification_badge = body.verificationBadge || 'verified-manager';
          }
        }
      }
      if (body.assignedAgentId !== undefined) {
        updates.assigned_agent_id = body.assignedAgentId;
        updates.assigned_at = body.assignedAgentId ? new Date().toISOString() : null;
      }
      if (body.rejectionReason !== undefined) {
        updates.rejection_reason = body.rejectionReason;
      }
    }

    // Agents can update submission status and document completion
    if (isAgent) {
      if (body.verificationStatus === 'submitted') {
        updates.verification_status = 'submitted';
        updates.submitted_at = new Date().toISOString();
      }
      if (body.documentUploadCompleted !== undefined) {
        updates.document_upload_completed = body.documentUploadCompleted;
      }
    }

    // Owners can update property details (only if pending or rejected)
    if (isOwner && (property.verification_status === 'pending' || property.verification_status === 'rejected')) {
      const allowedFields = ['title', 'description', 'price', 'location', 'city', 'state', 'plotSize', 'plotSizeUnit', 'propertyType', 'images'];
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          const dbField = field === 'plotSize' ? 'plot_size' : 
                         field === 'plotSizeUnit' ? 'plot_size_unit' :
                         field === 'propertyType' ? 'property_type' : field;
          updates[dbField] = body[field];
        }
      });
    }

    // Allow owners and staff to update images for any property (for initial upload)
    if ((isOwner || isManager || isAgent) && body.images !== undefined) {
      console.log('Updating images for property:', property.id, 'with URLs:', body.images);
      updates.images = body.images;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update using admin client to bypass RLS
    const { data: updatedProperty, error: updateError } = await adminClient
      .from('properties')
      .update(updates)
      .eq('id', property.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating property:', updateError);
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      );
    }

    console.log('Property updated successfully. Images column:', updatedProperty?.images);

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error('Property PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userRole = (session.user as any).role;
    const adminClient = createAdminClient();

    // Get the property first to check ownership
    const { data: property, error: fetchError } = await adminClient
      .from('properties')
      .select('*')
      .or(`id.eq.${slug},seo_slug.eq.${slug}`)
      .single();

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    const isOwner = property.owner_id === session.user.id;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminClient
      .from('properties')
      .delete()
      .eq('id', property.id);

    if (deleteError) {
      console.error('Error deleting property:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete property' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Property DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
