
import { Request, Response, NextFunction } from 'express';

interface CircuitState {
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailure: number;
    nextAttempt: number;
}

const BREAKER_OPTIONS = {
    failureThreshold: 20, // failures before opening
    resetTimeout: 10000,   // ms to wait before trying again
    monitorWindow: 60000   // ms window for failure counting
};

const circuit: CircuitState = {
    status: 'CLOSED',
    failures: 0,
    lastFailure: 0,
    nextAttempt: 0
};

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const isTestRuntime = process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toUpperCase() === 'MOCK';
const forceEnable = String(process.env.ENABLE_CIRCUIT_BREAKER || '').toLowerCase() === 'true';
const isEnabled = forceEnable || (!isTestRuntime && !isServerless);

export const circuitBreaker = (req: Request, res: Response, next: NextFunction) => {
    if (!isEnabled) {
        return next();
    }

    const now = Date.now();

    // 1. Check Circuit Status
    if (circuit.status === 'OPEN') {
        if (now > circuit.nextAttempt) {
            circuit.status = 'HALF_OPEN';
            console.warn(`⚠️ [CIRCUIT BREAKER] Half-Open: Allowing trial request.`);
        } else {
            console.warn(`🛑 [CIRCUIT BREAKER] Open: Blocked request to ${req.path}`);
            res.status(503).json({ error: 'Service Temporarily Unavailable (Circuit Breaker)' });
            return;
        }
    }

    // 2. Wrap Response to monitoring failures
    res.on('finish', () => {
        if (res.statusCode >= 500) {
            recordFailure();
        } else if (circuit.status === 'HALF_OPEN' && res.statusCode < 500) {
            resetCircuit();
        }
    });

    next();
};

function recordFailure() {
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= BREAKER_OPTIONS.failureThreshold && circuit.status === 'CLOSED') {
        circuit.status = 'OPEN';
        circuit.nextAttempt = Date.now() + BREAKER_OPTIONS.resetTimeout;
        console.error(`🔥 [CIRCUIT BREAKER] Threshold Reached! Circuit OPENed. Resets in ${BREAKER_OPTIONS.resetTimeout}ms`);
    }
}

function resetCircuit() {
    circuit.status = 'CLOSED';
    circuit.failures = 0;
    console.log(`✅ [CIRCUIT BREAKER] Circuit Closed (Recovered).`);
}

export const getCircuitStatus = () => ({ ...circuit });
