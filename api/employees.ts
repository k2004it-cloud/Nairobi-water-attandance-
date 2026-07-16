import { addEmployee, editEmployee, deleteEmployee } from './dataStore';

export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const employee = req.body;
      const result = addEmployee(employee);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || 'Unable to add employee' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const employee = req.body;
      const result = editEmployee(employee);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || 'Unable to update employee' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const employeeId = req.query?.id || req.body?.id;
      if (!employeeId || typeof employeeId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid employee id' });
        return;
      }

      const result = deleteEmployee(employeeId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || 'Unable to delete employee' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
