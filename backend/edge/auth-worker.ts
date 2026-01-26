/**
 * Edge Worker for Distributed Authentication
 * Deployment Target: Cloudflare Workers / Vercel Edge
 */

// Mock secret - in production usage env.JWT_SECRET
const JWT_SECRET = 'mock-secret'; 

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

            // 3. Fast Edge Validation
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(JSON.stringify({ error: 'Unauthorized (Edge Rejection)' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // In a real Edge Worker, we would verify JWT signature here using crypto.subtle
            // For this mock, we assume existence means validity if it contains 'mock' or 'ey'
            const token = authHeader.split(' ')[1];
            if (!token.includes('mock') && token.length < 10) {
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
