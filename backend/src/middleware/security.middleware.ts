import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

const WAF_PATTERNS: { id: string; regex: RegExp }[] = [
    { id: 'xss_script', regex: /<script\b[^>]*>/i },
    { id: 'xss_handler', regex: /\bon\w+\s*=\s*["']/i },
    { id: 'sqli_union', regex: /\bunion\s+all?\s+select\b/i },
    { id: 'sqli_or_true', regex: /\bor\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i },
    { id: 'sqli_drop', regex: /\b(drop|truncate|alter)\s+table\b/i },
];

const flattenPayload = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(flattenPayload).join(' ');
    if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).map(flattenPayload).join(' ');
    }
    return '';
};

export const detectMaliciousPayload = (payload: string): string | null => {
    for (const pattern of WAF_PATTERNS) {
        if (pattern.regex.test(payload)) {
            return pattern.id;
        }
    }
    return null;
};

export const securityHardening = (req: Request, res: Response, next: NextFunction) => {
    // 1. OWASP Compliance Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 2. Focused WAF checks tuned to reduce false positives.
    const payload = [req.body, req.query, req.params]
        .map((source) => flattenPayload(source))
        .join(' ')
        .slice(0, 5000);

    const blockedBy = detectMaliciousPayload(payload);
    if (blockedBy) {
        logger.warn('waf_blocked', {
            requestId: req.requestId,
            ip: req.ip,
            route: req.originalUrl || req.url,
            blockedBy,
        });
        return res.status(403).json({
            error: 'Forbidden',
            reason: 'WAF_BLOCKED',
        });
    }

    next();
};
