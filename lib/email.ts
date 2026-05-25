type CredentialsEmailInput = {
  to: string;
  name: string;
  username: string;
  password: string;
  role: string;
  loginUrl?: string;
};

import nodemailer from 'nodemailer';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRoleLabel(role: string) {
  if (role === 'business_partner') {
    return 'Business Partner';
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function createGmailTransport() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpUser || !smtpPassword || !smtpFrom) {
    throw new Error('Gmail SMTP is not configured. Set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
  }

  const portNumber = Number.parseInt(smtpPort, 10);

  if (Number.isNaN(portNumber)) {
    throw new Error('SMTP_PORT must be a valid number.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: portNumber,
    secure: portNumber === 465,
    requireTLS: portNumber === 587,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  return { transporter, smtpFrom };
}

function buildCredentialsEmailHtml({ name, username, password, role, loginUrl }: CredentialsEmailInput) {
  const safeName = escapeHtml(name);
  const safeUsername = escapeHtml(username);
  const safePassword = escapeHtml(password);
  const safeRole = escapeHtml(getRoleLabel(role));
  const safeLoginUrl = loginUrl ? escapeHtml(loginUrl) : '';

  return `
    <div style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
          <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">Swastika Infrastructures</div>
            <h1 style="margin:0;font-size:24px;line-height:1.2;color:#111827;">Your account is ready</h1>
          </div>

          <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
            Your ${safeRole} account has been created. Use the credentials below to log in.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Username</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${safeUsername}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Password</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;font-family:Menlo,Consolas,monospace;">${safePassword}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Role</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${safeRole}</td>
              </tr>
            </table>
          </div>

          ${safeLoginUrl ? `<p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">Login here: <a href="${safeLoginUrl}" style="color:#2563eb;">${safeLoginUrl}</a></p>` : ''}

          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
            Keep this email secure. If you did not expect this account, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendCredentialsEmail(input: CredentialsEmailInput) {
  const subject = `Your ${getRoleLabel(input.role)} account credentials`;
  const html = buildCredentialsEmailHtml(input);

  const { transporter, smtpFrom } = createGmailTransport();

  const info = await transporter.sendMail({
    from: smtpFrom,
    to: input.to,
    subject,
    html,
  });

  return Boolean(info.messageId);
}