import { checkIn } from './dataStore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { employeeId } = req.body || {};
  if (!employeeId || typeof employeeId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid employeeId' });
    return;
  }

  try {
    const result = await checkIn(employeeId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message || 'Unable to complete check-in' });
  }
}
