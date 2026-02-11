// Minimal Micro App for Vercel Debug
// NO IMPORTS except express
import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', micro: true, time: new Date().toISOString() });
});

app.use('*', (req, res) => res.status(404).json({ error: 'Not Found (Micro)' }));

export default app;
