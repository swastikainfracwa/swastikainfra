import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
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

    // Get user's MFA factors
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError || !factors || factors.totp.length === 0) {
      return NextResponse.json(
        { error: '2FA not enrolled' },
        { status: 400 }
      );
    }

    // Get the first TOTP factor (users typically have one)
    const factorId = factors.totp[0].id;

    // Verify the TOTP code
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      console.error('2FA challenge error:', error);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
    });
  } catch (error) {
    console.error('2FA challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
