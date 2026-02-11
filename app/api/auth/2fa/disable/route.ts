import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
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

    // Unenroll all TOTP factors
    for (const factor of factors.totp) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) {
        console.error('2FA unenroll error:', unenrollError);
      }
    }

    // Update user profile to disable 2FA
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ enable_2fa: false })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
