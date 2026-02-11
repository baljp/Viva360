// import app from '../backend/src/app.micro';
// export default function handler(req: any, res: any) {}

import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', inlined: true, time: new Date().toISOString() });
});

app.use('*', (req, res) => res.status(404).json({ error: 'Not Found (Inlined)' }));

export default app;
