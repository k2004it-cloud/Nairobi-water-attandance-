import { getAppData } from './dataStore';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = getAppData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Unable to load application data' });
  }
}
