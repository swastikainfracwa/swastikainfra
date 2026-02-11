import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;

    // Only admin and manager can view agents
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    const { data: agents, error } = await adminClient
      .from('profiles')
      .select('id, name, email, phone, role, created_at')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (error) {
    console.error('Agents GET error:', error);
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

    const userRole = (session.user as any).role;

    // Only admin can create agents
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can create agent accounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, password } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create agent profile
    const agentId = randomUUID();
    const { data: agent, error: createError } = await adminClient
      .from('profiles')
      .insert({
        id: agentId,
        email,
        name,
        phone,
        role: 'agent',
        password_hash: passwordHash,
        enable_2fa: false,
      })
      .select('id, name, email, phone, role, created_at')
      .single();

    if (createError) {
      console.error('Error creating agent:', createError);
      return NextResponse.json(
        { error: 'Failed to create agent account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: any) {
    console.error('Agent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
