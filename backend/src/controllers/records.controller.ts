import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { AuditService } from '../services/audit.service';

export const createNote = async (req: Request, res: Response) => {
    const proId = (req as any).user?.userId;
    const { patientId, content, type } = req.body; // type: 'anamnesis' | 'session'

    // 1. Audit Attempt
    await AuditService.logAccess(proId, `patient:${patientId}`, 'WRITE_RECORD', 'SUCCESS', `Type: ${type}`);

    if (isMockMode()) {
        return res.status(201).json({
            id: 'mock-record-id',
            patient_id: patientId,
            professional_id: proId,
            content,
            type,
            created_at: new Date().toISOString()
        });
    }

    // Real DB Implementation (Needs Record Model)
    // await prisma.record.create(...)
    return res.status(501).json({ error: 'DB Implementation pending schema update' });
};

export const listNotes = async (req: Request, res: Response) => {
    const requestorId = (req as any).user?.userId;
    const { patientId } = req.query; // If param is missing, assume list OWN records?

    const targetPatientId = (patientId as string) || requestorId;

    // 2. Permission Check (Mock ACL)
    // In real app: Check if 'requestorId' has grant for 'targetPatientId'
    // For now, allow if requestor == target OR requestor is PRO
    
    await AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');

    if (isMockMode()) {
        return res.json([
            { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety.', date: '2024-01-20' },
            { id: 'rec-2', type: 'session', content: 'Reiki session complete.', date: '2024-01-25' }
        ]);
    }

    return res.json([]);
};

export const grantAccess = async (req: Request, res: Response) => {
    const patientId = (req as any).user?.userId;
    const { professionalId } = req.body;

    await AuditService.logAccess(patientId, `grant:${professionalId}`, 'GRANT_ACCESS', 'SUCCESS');

    if (isMockMode()) {
        return res.json({ success: true, message: `Access granted to ${professionalId}` });
    }
    
    return res.json({ success: true });
};

export const exportData = async (req: Request, res: Response) => {
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
};
