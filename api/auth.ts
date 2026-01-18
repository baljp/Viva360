import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../src/lib/prisma';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { action, email, password, name, role } = request.body;

    try {
        if (action === 'register') {
            if (!email || !password || !name) {
                return response.status(400).json({ error: 'Missing required fields' });
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return response.status(400).json({ error: 'User already exists' });
            }

            const user = await prisma.user.create({
                data: {
                    email,
                    password, // WARNING: In production, use hashing (e.g., bcrypt)
                    name,
                    role: role || 'CLIENT',
                    avatar: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100)}`,
                },
            });

            return response.status(201).json(user);
        }

        if (action === 'login') {
            if (!email || !password) {
                return response.status(400).json({ error: 'Missing email or password' });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.password !== password) {
                return response.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });

            return response.status(200).json(user);
        }

        return response.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('Auth error:', error);
        return response.status(500).json({ error: 'Authentication failed' });
    }
}
