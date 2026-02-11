import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role = 'owner' } = body;

    // Validate required fields
    if (!email || !password || !name || !phone) {
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

    // Use admin client to bypass RLS for profile creation
    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Try logging in instead.' },
        { status: 400 }
      );
    }

    // Create auth user with metadata (trigger will create profile)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the auto-created profile (created by trigger) with password hash
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .update({
        name,
        phone,
        role,
        password_hash: passwordHash,
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Cleanup: delete auth user if profile update failed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Return success with user data (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
