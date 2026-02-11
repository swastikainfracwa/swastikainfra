import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const propertyType = searchParams.get('propertyType');
    const verified = searchParams.get('verified');
    const ownerId = searchParams.get('ownerId');
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');

    // Get NextAuth session for authorization
    const session = await auth();
    const userRole = session?.user ? (session.user as any).role : null;
    const userId = session?.user?.id;

    // Use admin client to bypass RLS since we're using NextAuth not Supabase Auth
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('properties')
      .select(`
        *,
        agent:assigned_agent_id(name, phone)
      `)
      .order('created_at', { ascending: false });

    // Authorization: If filtering by ownerId or agentId, verify user has permission
    if (ownerId) {
      // Only the owner themselves or staff can view properties by ownerId
      if (userId !== ownerId && !['admin', 'manager', 'agent'].includes(userRole || '')) {
        return NextResponse.json(
          { error: 'Forbidden - Cannot view other users properties' },
          { status: 403 }
        );
      }
      query = query.eq('owner_id', ownerId);
    }

    if (agentId) {
      // Only the agent themselves or staff can view properties by agentId
      if (userId !== agentId && !['admin', 'manager'].includes(userRole || '')) {
        return NextResponse.json(
          { error: 'Forbidden - Cannot view other agents properties' },
          { status: 403 }
        );
      }
      query = query.eq('assigned_agent_id', agentId);
    }

    // For public listing (no ownerId/agentId), show verified and pending properties
    // Rejected properties are hidden from public view
    if (!ownerId && !agentId && !['admin', 'manager'].includes(userRole || '')) {
      query = query.in('verification_status', ['verified', 'pending']);
    }

    // Apply other filters
    if (location) {
      query = query.or(`location.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    if (propertyType && propertyType !== 'all') {
      query = query.eq('property_type', propertyType);
    }

    if (verified === 'true') {
      query = query.eq('verification_status', 'verified');
    }

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    // Transform database response to match Property interface (snake_case to camelCase)
    const transformedProperties = (properties || []).map((prop: any) => {
      // Debug: Log images data
      if (prop.images) {
        console.log(`Property ${prop.id} images:`, prop.images, typeof prop.images);
      }
      
      return {
        id: prop.id,
        title: prop.title,
        description: prop.description,
        price: prop.price,
        location: prop.location,
        city: prop.city,
        state: prop.state,
        plotSize: prop.plot_size,
        plotSizeUnit: prop.plot_size_unit,
        propertyType: prop.property_type,
        images: prop.images || [],
        ownerId: prop.owner_id,
        ownerName: prop.owner_name,
        ownerPhone: prop.owner_phone,
        verificationStatus: prop.verification_status,
        verificationBadge: prop.verification_badge,
        isFeatured: prop.is_featured,
        isStaffCreated: prop.is_staff_created,
        documentUploadCompleted: prop.document_upload_completed,
        assignedAgentId: prop.assigned_agent_id,
        assignedAgentName: prop.agent?.name,
        assignedAgentPhone: prop.agent?.phone,
        seoSlug: prop.seo_slug,
        views: prop.views || 0,
        createdAt: new Date(prop.created_at),
        updatedAt: new Date(prop.updated_at),
      };
    });

    return NextResponse.json({ properties: transformedProperties });
  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      location,
      city,
      state,
      plotSize,
      plotSizeUnit,
      propertyType,
      images = []
    } = body;

    const { isStaffCreated = false, ownerContactNumber } = body;
    const userRole = (session.user as any).role;

    // Validate required fields
    if (!title || !description || !price || !location || !city || !state || !plotSize || !plotSizeUnit || !propertyType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate owner contact number for non-staff users
    if (!isStaffCreated && !ownerContactNumber) {
      return NextResponse.json(
        { error: 'Owner contact number is required' },
        { status: 400 }
      );
    }

    // Verify staff permission if isStaffCreated is true
    if (isStaffCreated && !['admin', 'manager', 'agent'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only staff can create pre-verified properties' },
        { status: 403 }
      );
    }

    // Generate SEO-friendly slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();

    const adminClient = createAdminClient();

    // Determine verification status and badge based on creator
    const verificationStatus = isStaffCreated ? 'verified' : 'pending';
    const verificationBadge = isStaffCreated ? 'verified-staff' : null;

    // Create property with owner info
    const { data: property, error } = await adminClient
      .from('properties')
      .insert({
        title,
        description,
        price,
        location,
        city,
        state,
        plot_size: plotSize,
        plot_size_unit: plotSizeUnit,
        property_type: propertyType,
        images,
        owner_id: session.user.id,
        owner_name: session.user.name || '',
        owner_phone: isStaffCreated ? (session.user as any).phone : ownerContactNumber,
        verification_status: verificationStatus,
        verification_badge: verificationBadge,
        is_staff_created: isStaffCreated,
        document_upload_completed: isStaffCreated, // Staff can upload documents immediately
        is_featured: false,
        seo_slug: slug,
        views: 0,
        ...(isStaffCreated && { verified_at: new Date().toISOString() })
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      );
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Properties POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
