import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import adminHandler from './api/admin.ts';
import appDataHandler from './api/appData.ts';
import employeesHandler from './api/employees.ts';
import checkinHandler from './api/checkin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 4173);

app.use(express.json());

app.use('/api/admin', adminHandler);
app.use('/api/appData', appDataHandler);
app.use('/api/employees', employeesHandler);
app.use('/api/checkin', checkinHandler);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Preview server running on http://localhost:${port}`);
});
