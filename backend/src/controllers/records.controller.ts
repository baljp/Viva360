import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';
import { notificationEngine } from '../services/notificationEngine.service';
import { z } from 'zod';

const createRecordSchema = z.object({
    patientId: z.string().min(2),
    content: z.string().min(3).max(10000),
    type: z.enum(['anamnesis', 'session']).default('session'),
});

const updateRecordSchema = z.object({
    content: z.string().min(3).max(10000).optional(),
    type: z.enum(['anamnesis', 'session']).optional(),
}).refine((input) => Boolean(input.content || input.type), {
    message: 'É necessário informar ao menos um campo para atualizar.',
});

const normalizeRole = (value?: string | null) => String(value || '').trim().toUpperCase();

const emitRecordNotifications = async (params: {
    actorId: string;
    patientId: string;
    professionalId: string;
    recordId: string;
    action: 'created' | 'updated';
    type: string;
    content: string;
}) => {
    const summary = String(params.content || '').trim().slice(0, 160);
    await notificationEngine.emit({
        type: 'record.updated',
        actorId: params.actorId,
        targetUserId: params.patientId,
        entityType: 'record',
        entityId: params.recordId,
        data: {
            action: params.action,
            type: params.type,
            summary,
        },
    });

    const professional = await prisma.profile.findUnique({
        where: { id: params.professionalId },
        select: { hub_id: true },
    }).catch(() => null);

    if (professional?.hub_id) {
        await notificationEngine.emit({
            type: 'record.updated.space',
            actorId: params.actorId,
            targetUserId: professional.hub_id,
            entityType: 'record',
            entityId: params.recordId,
            data: {
                action: params.action,
                type: params.type,
                summary,
            },
        });
    }
};

export const createNote = asyncHandler(async (req: Request, res: Response) => {
    const proId = String((req as any).user?.userId || '').trim();
    const userRole = normalizeRole((req as any).user?.role);
    if (!proId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'PROFESSIONAL') {
        return res.status(403).json({ error: 'Apenas guardiões podem atualizar prontuário.' });
    }

    const { patientId, content, type } = createRecordSchema.parse(req.body || {});

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

    emitRecordNotifications({
        actorId: proId,
        patientId,
        professionalId: proId,
        recordId: record.id,
        action: 'created',
        type,
        content,
    }).catch((error) => {
        console.warn('[Records] Failed to emit notifications:', String((error as any)?.message || error));
    });

    return res.status(201).json(record);
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
    const requestorId = String((req as any).user?.userId || '').trim();
    const queryPatientId = req.query?.patientId as string | undefined;
    const paramPatientId = req.params?.patientId as string | undefined;
    const targetPatientId = queryPatientId || paramPatientId || requestorId;
    const userRole = normalizeRole((req as any).user?.role);

    if (!requestorId || !targetPatientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Permission Check (Mock ACL)
    // LGPD ABSOLUTE RULE: ADMIN CANNOT VIEW RECORDS
    if (userRole === 'ADMIN') {
        console.warn(`🛑 [SECURITY] Admin ${requestorId} attempted to access PRONTUÁRIO. ACCESS DENIED.`);
        return res.status(403).json({ error: 'LGPD_VIOLATION: Admin cannot access sensitive health records.' });
    }

    if (userRole === 'CLIENT' && targetPatientId !== requestorId) {
        return res.status(403).json({ error: 'Sem permissão para acessar prontuário de outra pessoa.' });
    }

    await AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');

    if (isMockMode()) {
        return res.json([
            { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety. (Mock)', date: '2024-01-20' },
            { id: 'rec-2', type: 'session', content: 'Reiki session complete. (Mock)', date: '2024-01-25' }
        ]);
    }

    const where: any = { patient_id: targetPatientId };
    if (userRole === 'PROFESSIONAL' && targetPatientId !== requestorId) {
        where.professional_id = requestorId;
    }
    if (userRole === 'SPACE') {
        where.professional = { is: { hub_id: requestorId } };
    }

    const records = await prisma.record.findMany({
        where,
        orderBy: { created_at: 'desc' }
    });
    return res.json(records);
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
    const actorId = String((req as any).user?.userId || '').trim();
    const userRole = normalizeRole((req as any).user?.role);
    const recordId = String(req.params?.recordId || '').trim();
    if (!actorId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'PROFESSIONAL') {
        return res.status(403).json({ error: 'Apenas guardiões podem editar prontuário.' });
    }

    const payload = updateRecordSchema.parse(req.body || {});
    const existing = await prisma.record.findUnique({
        where: { id: recordId },
        select: { id: true, professional_id: true, patient_id: true, content: true, type: true },
    });
    if (!existing) {
        return res.status(404).json({ error: 'Registro não encontrado.' });
    }
    if (existing.professional_id !== actorId) {
        return res.status(403).json({ error: 'Sem permissão para editar este registro.' });
    }

    const updated = await prisma.record.update({
        where: { id: recordId },
        data: {
            content: payload.content ?? undefined,
            type: payload.type ?? undefined,
        },
    });

    emitRecordNotifications({
        actorId,
        patientId: existing.patient_id,
        professionalId: existing.professional_id,
        recordId: existing.id,
        action: 'updated',
        type: updated.type,
        content: updated.content,
    }).catch((error) => {
        console.warn('[Records] Failed to emit notifications:', String((error as any)?.message || error));
    });

    await AuditService.logAccess(actorId, `record:${recordId}`, 'UPDATE_RECORD', 'SUCCESS', `Type: ${updated.type}`);
    return res.json(updated);
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
