// Diagnostic Minimal App — captures import errors on boot
import express from 'express';

const app = express();
app.use(express.json());

// Health Check (always available)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', minimal: true, time: new Date().toISOString() });
});

// Diagnostic: capture the EXACT error from importing auth routes
let bootError: string | null = null;
let authRouter: any = null;

try {
    // Eagerly require the auth routes to capture any init-time crash
    const mod = require('./routes/auth.routes');
    authRouter = mod.default || mod;
} catch (err: any) {
    bootError = `[BOOT_CRASH] ${err.message}\n${err.stack}`;
    console.error(bootError);
}

// Diagnostic endpoint to expose the boot error
app.get('/api/boot-status', (req, res) => {
    res.json({ bootError: bootError || 'none', hasAuthRouter: !!authRouter });
});

if (authRouter) {
    app.use('/api/auth', authRouter);
} else {
    // If auth failed to load, serve an error on those routes
    app.use('/api/auth', (req, res) => {
        res.status(503).json({ error: 'Auth module failed to load', bootError });
    });
}

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Not Found in Minimal Mode' }));

export default app;
