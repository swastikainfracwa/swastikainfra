import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '50'; // Default 50km

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      return NextResponse.json(
        { error: 'Invalid latitude, longitude, or radius values' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Fetch properties with coordinates and calculate distance using Haversine formula
    // Formula: distance = 6371 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)))
    const { data: properties, error } = await supabase.rpc('get_nearby_properties', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
    });

    // If the stored procedure doesn't exist, fall back to client-side calculation
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      // Fetch all properties with coordinates
      const { data: allProperties, error: fetchError } = await supabase
        .from('properties')
        .select(`
          *,
          agent:assigned_agent_id(name, phone)
        `)
        .eq('verification_status', 'verified')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (fetchError) {
        console.error('Error fetching properties:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch properties' },
          { status: 500 }
        );
      }

      // Calculate distance for each property using Haversine formula
      const propertiesWithDistance = (allProperties || [])
        .map((prop: any) => {
          const distance = calculateDistance(
            lat,
            lng,
            prop.latitude,
            prop.longitude
          );

          return {
            ...prop,
            distance,
          };
        })
        .filter((prop: any) => prop.distance <= radiusKm)
        .sort((a: any, b: any) => a.distance - b.distance);

      // Transform to match Property interface
      const transformedProperties = propertiesWithDistance.map((prop: any) => ({
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
        youtubeVideoUrl: prop.youtube_video_url,
        latitude: prop.latitude,
        longitude: prop.longitude,
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
        assignedAt: prop.assigned_at ? new Date(prop.assigned_at) : undefined,
        submittedAt: prop.submitted_at ? new Date(prop.submitted_at) : undefined,
        verifiedAt: prop.verified_at ? new Date(prop.verified_at) : undefined,
        rejectionReason: prop.rejection_reason,
        seoSlug: prop.seo_slug,
        views: prop.views || 0,
        createdAt: new Date(prop.created_at),
        updatedAt: new Date(prop.updated_at),
        distance: prop.distance, // Distance in kilometers
      }));

      return NextResponse.json({ properties: transformedProperties });
    }

    if (error) {
      console.error('Error fetching nearby properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch nearby properties' },
        { status: 500 }
      );
    }

    // Transform properties from stored procedure (if it exists)
    const transformedProperties = (properties || []).map((prop: any) => ({
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
      youtubeVideoUrl: prop.youtube_video_url,
      latitude: prop.latitude,
      longitude: prop.longitude,
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
      distance: prop.distance, // Distance in kilometers
    }));

    return NextResponse.json({ properties: transformedProperties });
  } catch (error) {
    console.error('Nearby properties GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
