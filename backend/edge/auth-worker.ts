/**
 * Edge Worker for Distributed Authentication
 * Deployment Target: Cloudflare Workers / Vercel Edge
 */

const encoder = new TextEncoder();

const base64UrlToBytes = (input: string): Uint8Array => {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
};

const decodeJson = (segment: string) => {
    const bytes = base64UrlToBytes(segment);
    return JSON.parse(new TextDecoder().decode(bytes));
};

const verifyJwtHS256 = async (token: string, secret: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = decodeJson(headerB64);
    if (header.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBytes(signatureB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature as any, data as any);
    if (!valid) return null;

    const payload = decodeJson(payloadB64);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;
    return payload;
};

export default {
    async fetch(request: Request, env: any, ctx: any) {
        const url = new URL(request.url);

        // 1. Intercept API requests
        if (url.pathname.startsWith('/api/')) {
            const authHeader = request.headers.get('Authorization');

            // 2. Allow public endpoints
            if (url.pathname.startsWith('/api/auth/login') || url.pathname.startsWith('/api/auth/register')) {
                return fetch(request);
            }

            const secret = env?.JWT_SECRET;
            if (!secret) {
                return new Response(JSON.stringify({ error: 'JWT_SECRET missing on edge' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 3. Fast Edge Validation
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(JSON.stringify({ error: 'Unauthorized (Edge Rejection)' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const token = authHeader.split(' ')[1];
            const payload = await verifyJwtHS256(token, secret);
            if (!payload) {
                return new Response(JSON.stringify({ error: 'Invalid Token (Edge Rejection)' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 4. Forward to Origin if valid
            // We add a header to signal origin that it was pre-validated
            const newRequest = new Request(request);
            newRequest.headers.set('X-Edge-Auth', 'true');
            return fetch(newRequest);
        }

        // Static assets fallback
        return fetch(request);
    }
};
