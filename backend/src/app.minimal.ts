// Diagnostic Minimal App — captures import errors on boot
import express from 'express';
import type { Router } from 'express';
import { attachRawBody } from './lib/httpSecurity';
import { logger } from './lib/logger';

const app = express();
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '2mb';
app.use(express.json({ limit: jsonBodyLimit, verify: attachRawBody }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

// Health Check (always available)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', minimal: true, time: new Date().toISOString() });
});

// Diagnostic: capture the EXACT error from importing auth routes
let bootError: string | null = null;
let authRouter: Router | null = null;

const formatUnknownError = (error: unknown) => {
    if (error instanceof Error) return `${error.message}\n${error.stack || ''}`.trim();
    return String(error);
};

try {
    // Eagerly require the auth routes to capture any init-time crash
    const mod = require('./routes/auth.routes');
    authRouter = mod.default || mod;
} catch (err) {
    bootError = `[BOOT_CRASH] ${formatUnknownError(err)}`;
    logger.error('boot.minimal_auth_router_import_failed', { bootError });
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
