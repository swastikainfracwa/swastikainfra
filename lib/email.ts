type CredentialsEmailInput = {
  to: string;
  name: string;
  username: string;
  password: string;
  role: string;
  loginUrl?: string;
};

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
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const subject = `Your ${getRoleLabel(input.role)} account credentials`;
  const html = buildCredentialsEmailHtml(input);

  if (apiKey && fromEmail) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: input.to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send credentials email: ${response.status} ${errorText}`);
    }

    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('Email service is not configured. Credentials email preview:', {
      to: input.to,
      subject,
      html,
    });
    return;
  }

  throw new Error('Email service is not configured');
}