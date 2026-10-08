import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { userEmail, category, rating, message } = await req.json();

    if (!userEmail || !message) {
      return NextResponse.json({ error: 'User email and message content are required.' }, { status: 400 });
    }

    const feedbackEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userEmail,
      category: category || 'GENERAL',
      rating: Number(rating) || 5,
      message,
      createdAt: new Date().toISOString(),
    };

    // 1. Local append to feedback logs
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, 'feedback.json');
      const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : [];
      existing.push(feedbackEntry);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    } catch (fsErr) {
      console.error('Local feedback file write error:', fsErr);
    }

    // 2. Dispatch alert via SMTP if credentials are valid
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass && !smtpUser.includes('your_gmail')) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''),
        },
      });

      await transporter.sendMail({
        from: `"JARVIS Telemetry Core" <${smtpUser}>`,
        to: smtpUser,
        subject: `[JARVIS FEEDBACK] [${feedbackEntry.category.toUpperCase()}] Rating: ${feedbackEntry.rating}/5`,
        html: `
          <div style="background:#07090e; color:#e0f7fa; font-family:monospace; padding:24px; border-radius:8px; border:1px solid #00f0ff;">
            <h3 style="color:#00f0ff; margin-top:0;">JARVIS OPERATOR FEEDBACK</h3>
            <p><strong>From:</strong> ${userEmail}</p>
            <p><strong>Category:</strong> ${feedbackEntry.category}</p>
            <p><strong>Rating:</strong> ${'★'.repeat(feedbackEntry.rating)}${'☆'.repeat(5 - feedbackEntry.rating)}</p>
            <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:6px; margin-top:12px;">
              ${message}
            </div>
            <p style="font-size:11px; color:#64748b; margin-top:16px;">Timestamp: ${feedbackEntry.createdAt}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, feedback: feedbackEntry });
  } catch (error: any) {
    console.error('Feedback Route Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to record feedback' }, { status: 500 });
  }
}
