import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const otpStore = (globalThis as typeof globalThis & {
  otpStore?: Map<string, { code: string; expiresAt: number }>;
}).otpStore ?? new Map<string, { code: string; expiresAt: number }>();
(globalThis as typeof globalThis & { otpStore?: Map<string, { code: string; expiresAt: number }> }).otpStore = otpStore;

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; otp?: string };
    const email = String(body?.email ?? '').trim().toLowerCase();
    const otp = String(body?.otp ?? '');
    const record = otpStore.get(email);

    if (!email || !/^\d{6}$/.test(otp) || !record || record.expiresAt < Date.now() || record.code !== otp) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired OTP code'
      }, { status: 400 });
    }

    otpStore.delete(email);
    const token = `jarvis-sess-${Date.now()}`;

    return NextResponse.json({
      success: true,
      user: { email, name: email.split('@')[0], accessLevel: 'ADMIN_OPERATOR' },
      token,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
  }
}