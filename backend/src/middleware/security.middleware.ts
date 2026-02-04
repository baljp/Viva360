import { Request, Response, NextFunction } from 'express';

export const securityHardening = (req: Request, res: Response, next: NextFunction) => {
    // 1. OWASP Compliance Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 2. Simple WAF Simulation (Detecting common attacks)
    const maliciousPatterns = [
        /<script/i,
        /UNION SELECT/i,
        /OR 1=1/i,
        /DROP TABLE/i,
        /--/i
    ];

    const payload = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);

    if (maliciousPatterns.some(pattern => pattern.test(payload))) {
        console.warn(`🛑 [WAF ALERT] Malicious pattern detected from IP ${req.ip}. Payload: ${payload}`);
        return res.status(403).json({ error: 'Security Breach Blocked' });
    }

    next();
};
