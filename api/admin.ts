import { NextApiRequest, NextApiResponse } from 'next';
import {
  verifyAdminPassword,
  setAdminPassword,
  createResetToken,
  resetPasswordWithToken
} from './dataStore';

export default function handler(req: any, res: any) {
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
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      // create token (in real system, send email)
      const token = createResetToken(email);
      // Return token for demonstration (remove in production)
      return res.json({ success: true, token });
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
