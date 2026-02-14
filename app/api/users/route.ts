import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

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

    // Only managers and admins can fetch users
    if (!['manager', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    const supabase = await createAdminClient();
    
    let query = supabase
      .from('profiles')
      .select('id, name, email, phone, role, employee_id, created_at')
      .order('created_at', { ascending: false });

    // Filter by role if specified
    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    // Only admins can create users
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, password } = body;

    // Validation
    if (!name || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const validRoles = ['visitor', 'owner', 'agent', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create auth user with metadata (trigger will create profile)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      console.error('Error creating auth user:', authError);
      console.error('Full error details:', JSON.stringify(authError, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to create user account', 
          details: authError.message,
          code: authError.code 
        },
        { status: 500 }
      );
    }

    // Small delay to ensure trigger has completed (employees get IDs from trigger)
    await new Promise(resolve => setTimeout(resolve, 200));

    // First, verify profile was created
    const { data: profileCheck, error: checkError } = await supabase
      .from('profiles')
      .select('id, employee_id, role')
      .eq('id', authData.user.id)
      .single();

    console.log('Profile after trigger:', profileCheck);

    // If employee_id is missing for agent/manager, generate it manually
    if (profileCheck && (profileCheck.role === 'agent' || profileCheck.role === 'manager') && !profileCheck.employee_id) {
      console.warn('Employee ID was not set by trigger, generating manually...');
      
      // Call the generate_employee_id function directly
      const { data: empIdResult, error: empIdError } = await supabase
        .rpc('generate_employee_id');
      
      if (!empIdError && empIdResult) {
        // Update with generated employee_id
        await supabase
          .from('profiles')
          .update({ employee_id: empIdResult })
          .eq('id', authData.user.id);
        
        console.log('Manually generated employee_id:', empIdResult);
      }
    }

    // Update the auto-created profile with password hash
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        password_hash: hashedPassword,
      })
      .eq('id', authData.user.id)
      .select('id, name, email, phone, role, employee_id')
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      console.error('Profile error details:', JSON.stringify(profileError, null, 2));
      // Cleanup: delete auth user if profile update failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('User created successfully with profile:', {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      employee_id: profile.employee_id,
      check_employee_id: profileCheck?.employee_id
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        employee_id: profile.employee_id,
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
