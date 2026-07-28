import { Resend } from 'resend';

export async function sendOtpEmail(toEmail: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Rova Security <onboarding@resend.dev>';

  console.log(`\n======================================================`);
  console.log(`[ROVA AUTH OTP] Target Email : ${toEmail}`);
  console.log(`[ROVA AUTH OTP] Verification Code : ${code}`);
  console.log(`[ROVA AUTH OTP] Expires In : 10 minutes`);
  console.log(`======================================================\n`);

  if (!apiKey) {
    console.warn('[ROVA MAILER] RESEND_API_KEY missing in .env.local — logged OTP code to console above.');
    return true;
  }

  try {
    const resend = new Resend(apiKey);

    const htmlContent = `
      <div style="font-family: Inter, -apple-system, sans-serif; background-color: #0d1520; color: #ffffff; padding: 40px 20px; border-radius: 12px; max-width: 480px; margin: 0 auto; border: 1px solid rgba(180, 244, 215, 0.15);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">ROVA</h1>
          <p style="color: #8b9ba8; font-size: 13px; margin-top: 4px;">Autonomous Money Movement on Arc</p>
        </div>
        <div style="background-color: #131d2a; padding: 24px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 16px;">Your 6-digit Sign In verification code is:</p>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 0.25em; color: #BFFF00; background: #080d14; padding: 16px; border-radius: 8px; font-family: monospace;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `Your Rova Sign In Verification Code: ${code}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[ROVA RESEND ERROR] Failed to send email via Resend:', error);
      return false;
    }

    console.log('[ROVA RESEND SUCCESS] Sent email ID:', data?.id);
    return true;
  } catch (err) {
    console.error('[ROVA MAILER FATAL ERROR] Resend dispatch exception:', err);
    return false;
  }
}
