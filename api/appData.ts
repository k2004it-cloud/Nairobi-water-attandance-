import { getAppData } from './dataStore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = await getAppData();
    res.status(200).json(data);
  } catch (error) {
    console.error('appData handler error:', error);
    res.status(500).json({
      error: (error as Error).message || 'Unable to load application data',
      details: (error as any).stack
    });
  }
}
