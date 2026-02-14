import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Lead } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    const propertyId = searchParams.get('propertyId');

    // Fetch from Supabase database
    const supabase = await createAdminClient();
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by owner if specified
    if (ownerId) {
      // Get properties owned by this user
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);
      
      if (properties && properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        query = query.in('property_id', propertyIds);
      } else {
        // No properties found, return empty array
        return NextResponse.json({ leads: [] });
      }
    }

    // Filter by property if specified
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Transform to match Lead interface
    const transformedLeads: Lead[] = (leads || []).map((lead) => ({
      id: lead.id,
      propertyId: lead.property_id,
      propertyTitle: lead.property_title,
      name: lead.name,
      phone: lead.phone,
      createdAt: new Date(lead.created_at),
    }));

    return NextResponse.json({ leads: transformedLeads });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, propertyTitle, name, phone } = body;

    // Validate input
    if (!propertyId || !propertyTitle || !name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to Supabase database
    const supabase = await createAdminClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        property_id: propertyId,
        property_title: propertyTitle,
        name,
        phone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    // Transform to match Lead interface
    const transformedLead: Lead = {
      id: lead.id,
      propertyId: lead.property_id,
      propertyTitle: lead.property_title,
      name: lead.name,
      phone: lead.phone,
      createdAt: new Date(lead.created_at),
    };

    return NextResponse.json({ lead: transformedLead }, { status: 201 });
  } catch (error) {
    console.error('Lead POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
