import {
  verifyAdminPassword,
  setAdminPassword,
  createResetToken,
  resetPasswordWithToken
} from './dataStore.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'no-reply@nairobi-water.app';

function hasEmailConfig() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

async function createTransport() {
  if (!hasEmailConfig()) return null;

  try {
    const nodemailer = await import('nodemailer');
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER!,
        pass: SMTP_PASS!
      }
    });
  } catch (err: any) {
    console.error('Failed to import nodemailer:', err);
    return null;
  }
}

function getRequestOrigin(req: any) {
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

async function sendResetEmail(email: string, resetLink: string, token: string) {
  const transport = await createTransport();
  if (!transport) return false;

  await transport.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Nairobi Water Admin Password Reset',
    text: `We received a request to reset your Nairobi Water admin password.\n\nUse this link to reset your password:\n${resetLink}\n\nIf the link does not work, use this token:\n${token}\n\nThis link expires in 1 hour.`,
    html: `<p>We received a request to reset your Nairobi Water admin password.</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If the link does not work, use this token:</p>
      <pre>${token}</pre>
      <p>This link expires in 1 hour.</p>`
  });

  return true;
}

export default async function handler(req: any, res: any) {
  const method = req.method;

  if (method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action } = req.body || {};

  try {
    if (action === 'login') {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: 'Password required' });
      const ok = verifyAdminPassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid password' });
      return res.json({ success: true });
    }

    if (action === 'change') {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing parameters' });
      const result = setAdminPassword(currentPassword, newPassword);
      return res.json({ success: true, email: result.email });
    }

    if (action === 'forgot') {
      const email = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'admin@nairobi.local';
      const token = createResetToken(email);
      const resetLink = `${getRequestOrigin(req)}/admin?resetToken=${encodeURIComponent(token)}`;

      if (hasEmailConfig()) {
        try {
          await sendResetEmail(email, resetLink, token);
          return res.json({ success: true, email, message: `A reset link has been sent to ${email}.` });
        } catch (err: any) {
          console.error('Password reset email failed:', err);
          return res.json({
            success: true,
            token,
            email,
            message: 'Email provider failed; reset token returned for local testing.'
          });
        }
      }

      return res.json({
        success: true,
        token,
        email,
        message: `No SMTP configuration found. Reset token returned for testing for ${email}.`
      });
    }

    if (action === 'reset') {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Missing parameters' });
      const result = resetPasswordWithToken(token, newPassword);
      return res.json({ success: true, email: result.email });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error processing request' });
  }
}
