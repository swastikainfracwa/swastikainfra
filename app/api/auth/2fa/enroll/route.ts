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

    // Enroll user in MFA
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      console.error('2FA enrollment error:', error);
      return NextResponse.json(
        { error: 'Failed to enroll in 2FA' },
        { status: 500 }
      );
    }

    // Return QR code and secret for user to scan with authenticator app
    return NextResponse.json({
      secret: data.totp.secret,
      qrCode: data.totp.qr_code,
      factorId: data.id,
    });
  } catch (error) {
    console.error('2FA enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
