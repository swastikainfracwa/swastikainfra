import { NextRequest, NextResponse } from 'next/server';
import { mockLeads, getLeadsByOwner } from '@/lib/mockData';
import { cookies } from 'next/headers';
import type { Lead } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');

    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');

    let filteredLeads = [...mockLeads];

    // Filter by owner if specified
    if (ownerId) {
      filteredLeads = getLeadsByOwner(ownerId);
    }

    return NextResponse.json({ leads: filteredLeads });
  } catch (error) {
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

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      propertyId,
      propertyTitle,
      name,
      phone,
      createdAt: new Date(),
    };

    // Add to mock leads (in-memory only)
    mockLeads.push(newLead);

    return NextResponse.json({ lead: newLead });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
