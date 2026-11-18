const { Resend } = require('resend');

let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

async function sendInvitationEmail({ to, workspaceName, role, inviteUrl }) {
  const from = process.env.EMAIL_FROM || 'BrandCheck <onboarding@resend.dev>';
  const subject = `You've been invited to join ${workspaceName} on BrandCheck`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e1b4b; margin-bottom: 16px;">Join ${workspaceName} on BrandCheck</h2>
      <p style="color: #334155; font-size: 15px; line-height: 24px;">
        You have been invited to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
      </p>
      <div style="margin: 32px 0;">
        <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 20px;">
        Or copy and paste this URL into your browser:<br />
        <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  if (!resendClient) {
    console.log('[Email Service - Mock / Local Dev]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Invite URL: ${inviteUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await resendClient.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send invitation email via Resend:', error.message);
    // Don't crash the invitation flow if email delivery fails in development/testing
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendInvitationEmail,
};

