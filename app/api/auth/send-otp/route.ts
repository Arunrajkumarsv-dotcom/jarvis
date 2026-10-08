import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const otpStore = (globalThis as typeof globalThis & {
  otpStore?: Map<string, { code: string; expiresAt: number }>;
}).otpStore ?? new Map<string, { code: string; expiresAt: number }>();
(globalThis as typeof globalThis & { otpStore?: Map<string, { code: string; expiresAt: number }> }).otpStore = otpStore;

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanEmail, { code: otpCode, expiresAt });

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass && !smtpUser.includes('your_gmail')) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass.replace(/\s+/g, ''),
          },
        });

        await transporter.sendMail({
          from: `"JARVIS Security Core" <${smtpUser}>`,
          to: cleanEmail,
          subject: `[JARVIS] Your Access Key: ${otpCode}`,
          html: `
            <div style="background:#07090e; color:#e0f7fa; font-family:monospace; padding:32px; border-radius:12px; border:1px solid #00f0ff; max-width:500px; margin:0 auto;">
              <h2 style="color:#00f0ff; letter-spacing:3px; margin:0 0 6px 0;">JARVIS // AUTHENTICATION</h2>
              <p style="color:#94a3b8; font-size:13px; margin:0 0 20px 0;">SECURITY PROTOCOL ACTIVE</p>
              <p style="color:#cbd5e1; font-size:14px; margin-bottom:12px;">Your one-time quantum verification code is:</p>
              <div style="background:rgba(0,240,255,0.08); padding:18px; border-radius:8px; text-align:center; margin:16px 0; border:1px dashed #00f0ff;">
                <span style="font-size:36px; font-weight:bold; letter-spacing:10px; color:#ffffff;">${otpCode}</span>
              </div>
              <p style="font-size:12px; color:#64748b; margin-top:20px;">This code expires in 5 minutes.</p>
            </div>
          `,
        });
      } catch (smtpError: any) {
        console.error('[SMTP Error]:', smtpError);
        return NextResponse.json({
          success: false,
          error: `SMTP delivery failed: ${smtpError.message}. Please check App Password settings.`
        }, { status: 500 });
      }
    } else {
      console.log(`[AUTH OTP DEBUG] ${cleanEmail} -> ${otpCode}`);
    }

    return NextResponse.json({ success: true, message: 'OTP dispatched successfully' });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to dispatch email' }, { status: 500 });
  }
}