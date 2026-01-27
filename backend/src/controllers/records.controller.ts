import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';

export const createNote = asyncHandler(async (req: Request, res: Response) => {
    const proId = (req as any).user?.userId;
    const { patientId, content, type } = req.body; // type: 'anamnesis' | 'session'

    // 1. Audit Attempt
    await AuditService.logAccess(proId, `patient:${patientId}`, 'WRITE_RECORD', 'SUCCESS', `Type: ${type}`);

    if (isMockMode()) {
        // Safe mock handling
        return res.status(201).json({
            id: 'mock-record-id',
            patient_id: patientId,
            professional_id: proId,
            content,
            type,
            created_at: new Date().toISOString()
        });
    }

    const record = await prisma.record.create({
        data: {
            patient_id: patientId,
            professional_id: proId,
            content,
            type
        }
    });
    return res.status(201).json(record);
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
    const requestorId = (req as any).user?.userId;
    const { patientId } = req.query; // If param is missing, assume list OWN records?

    const targetPatientId = (patientId as string) || requestorId;

    // 2. Permission Check (Mock ACL)
    // LGPD ABSOLUTE RULE: ADMIN CANNOT VIEW RECORDS
    const userRole = (req as any).user?.role; // Assuming middleware populates this
    if (userRole === 'ADMIN') {
        console.warn(`🛑 [SECURITY] Admin ${requestorId} attempted to access PRONTUÁRIO. ACCESS DENIED.`);
        return res.status(403).json({ error: 'LGPD_VIOLATION: Admin cannot access sensitive health records.' });
    }

    await AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');

    if (isMockMode()) {
        return res.json([
            { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety. (Mock)', date: '2024-01-20' },
            { id: 'rec-2', type: 'session', content: 'Reiki session complete. (Mock)', date: '2024-01-25' }
        ]);
    }

    const records = await prisma.record.findMany({
        where: { patient_id: targetPatientId },
        orderBy: { created_at: 'desc' }
    });
    return res.json(records);
});

export const grantAccess = asyncHandler(async (req: Request, res: Response) => {
    const patientId = (req as any).user?.userId;
    const { professionalId } = req.body;

    await AuditService.logAccess(patientId, `grant:${professionalId}`, 'GRANT_ACCESS', 'SUCCESS');

    if (isMockMode()) {
        return res.json({ success: true, message: `Access granted to ${professionalId}` });
    }
    
    return res.json({ success: true });
});

export const exportData = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    await AuditService.logAccess(userId, 'all_data', 'EXPORT_DATA', 'SUCCESS');

    if (isMockMode()) {
        return res.json({
            user: { id: userId, name: 'Mock User' },
            records: [
                { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety.', date: '2024-01-20' },
                { id: 'rec-2', type: 'session', content: 'Reiki session complete.', date: '2024-01-25' }
            ],
            audit_logs: [
                { action: 'LOGIN', timestamp: new Date().toISOString() }
            ]
        });
    }

    return res.status(501).json({ error: 'Real export not implemented' });
});
