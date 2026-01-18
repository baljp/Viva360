import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../src/lib/prisma';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    try {
        const clinics = await prisma.clinic.findMany();
        return response.status(200).json(clinics);
    } catch (error) {
        return response.status(500).json({ error: 'Failed to fetch clinics' });
    }
}
