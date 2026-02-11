import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { factorId, code } = body;

    if (!factorId || !code) {
      return NextResponse.json(
        { error: 'Factor ID and verification code are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the TOTP code
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      console.error('2FA verification error:', error);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Update user profile to enable 2FA
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ enable_2fa: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      factorId,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
