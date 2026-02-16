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
const normalizeStatus = (value?: string | null) => String(value || '').trim().toUpperCase();
const CONSENT_LINK_TYPE = 'patient';
const ACTIVE_CONSENT_STATUSES = new Set(['ACTIVE', 'ACCEPTED']);
const STRICT_RECORD_CONSENT = String(process.env.STRICT_RECORD_CONSENT || '').toLowerCase() === 'true';
const mockConsentStore = new Map<string, 'ACTIVE' | 'REVOKED'>();

const consentKey = (patientId: string, professionalId: string) => `${patientId}::${professionalId}`;

const hasLegacyProfessionalRelationship = async (patientId: string, professionalId: string) => {
    const existing = await prisma.record.findFirst({
        where: { patient_id: patientId, professional_id: professionalId },
        select: { id: true },
    });
    return Boolean(existing);
};

const isProfessionalRoleProfile = async (profileId: string) => {
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            role: true,
            active_role: true,
            profile_roles: {
                select: { role: true },
            },
        },
    });
    if (!profile) return false;

    const roles = new Set<string>();
    roles.add(normalizeRole(profile.role));
    roles.add(normalizeRole(profile.active_role));
    (profile.profile_roles || []).forEach((entry) => roles.add(normalizeRole(entry.role)));
    return roles.has('PROFESSIONAL');
};

const hasActiveConsentForRecord = async (
    patientId: string,
    professionalId: string,
    opts?: { mockRuntime?: boolean },
) => {
    if (opts?.mockRuntime) {
        if (!STRICT_RECORD_CONSENT) return true;
        return mockConsentStore.get(consentKey(patientId, professionalId)) === 'ACTIVE';
    }

    const consent = await prisma.profileLink.findUnique({
        where: {
            source_id_target_id_type: {
                source_id: patientId,
                target_id: professionalId,
                type: CONSENT_LINK_TYPE,
            },
        },
        select: { status: true },
    });

    if (consent) {
        return ACTIVE_CONSENT_STATUSES.has(normalizeStatus(consent.status));
    }

    // Transitional compatibility keeps legacy clinical pairs valid unless strict mode is enabled.
    if (STRICT_RECORD_CONSENT) return false;
    return hasLegacyProfessionalRelationship(patientId, professionalId);
};

const emitRecordNotifications = async (params: {
    actorId: string;
    patientId: string;
    professionalId: string;
    recordId: string;
    action: 'created' | 'updated';
    type: string;
    content: string;
}) => {
    // Never propagate raw record content in notifications/log payloads.
    const redactedMeta = {
        contentLength: String(params.content || '').trim().length,
    };
    await notificationEngine.emit({
        type: 'record.updated',
        actorId: params.actorId,
        targetUserId: params.patientId,
        entityType: 'record',
        entityId: params.recordId,
        data: {
            action: params.action,
            type: params.type,
            ...redactedMeta,
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
                ...redactedMeta,
            },
        });
    }
};

export const createNote = asyncHandler(async (req: Request, res: Response) => {
    const proId = String((req as any).user?.userId || '').trim();
    const userRole = normalizeRole((req as any).user?.role);
    const mockRuntime = isMockMode();
    if (!proId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'PROFESSIONAL') {
        return res.status(403).json({ error: 'Apenas guardiões podem atualizar prontuário.' });
    }

    const { patientId, content, type } = createRecordSchema.parse(req.body || {});

    if ((STRICT_RECORD_CONSENT || !mockRuntime) && patientId !== proId) {
        const consentGranted = await hasActiveConsentForRecord(patientId, proId, { mockRuntime });
        if (!consentGranted) {
            return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente não concedeu consentimento para este prontuário.' });
        }
    }

    // 1. Audit Attempt
    await AuditService.logAccess(proId, `patient:${patientId}`, 'WRITE_RECORD', 'SUCCESS', `Type: ${type}`);

    if (mockRuntime) {
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
    const mockRuntime = isMockMode();

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
    if ((STRICT_RECORD_CONSENT || !mockRuntime) && userRole === 'PROFESSIONAL' && targetPatientId !== requestorId) {
        const consentGranted = await hasActiveConsentForRecord(targetPatientId, requestorId, { mockRuntime });
        if (!consentGranted) {
            return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente não concedeu consentimento para este prontuário.' });
        }
    }

    await AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');

    if (mockRuntime) {
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
    const mockRuntime = isMockMode();
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
    if ((STRICT_RECORD_CONSENT || !mockRuntime) && existing.patient_id !== actorId) {
        const consentGranted = await hasActiveConsentForRecord(existing.patient_id, actorId, { mockRuntime });
        if (!consentGranted) {
            return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente revogou ou não concedeu consentimento.' });
        }
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
    const patientId = String((req as any).user?.userId || '').trim();
    const userRole = normalizeRole((req as any).user?.role);
    const professionalId = String(req.body?.professionalId || '').trim();
    const mockRuntime = isMockMode();

    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'CLIENT') {
        return res.status(403).json({ error: 'Apenas buscadores podem conceder consentimento clínico.' });
    }
    if (!professionalId) {
        return res.status(400).json({ error: 'professionalId inválido.' });
    }
    if (professionalId === patientId) {
        return res.status(400).json({ error: 'Não é possível conceder consentimento para si mesmo.' });
    }

    await AuditService.logAccess(patientId, `grant:${professionalId}`, 'GRANT_ACCESS', 'SUCCESS');

    if (mockRuntime) {
        if (STRICT_RECORD_CONSENT) {
            mockConsentStore.set(consentKey(patientId, professionalId), 'ACTIVE');
        }
        return res.json({
            success: true,
            message: `Access granted to ${professionalId}`,
            consent: { patientId, professionalId, status: 'ACTIVE', mock: true },
        });
    }

    const isProfessional = await isProfessionalRoleProfile(professionalId);
    if (!isProfessional) {
        return res.status(404).json({ error: 'Profissional não encontrado para consentimento.' });
    }

    await prisma.profileLink.upsert({
        where: {
            source_id_target_id_type: {
                source_id: patientId,
                target_id: professionalId,
                type: CONSENT_LINK_TYPE,
            },
        },
        update: {
            status: 'active',
        },
        create: {
            source_id: patientId,
            target_id: professionalId,
            type: CONSENT_LINK_TYPE,
            status: 'active',
        },
    });

    return res.json({
        success: true,
        consent: { patientId, professionalId, status: 'ACTIVE' },
    });
});

export const revokeAccess = asyncHandler(async (req: Request, res: Response) => {
    const patientId = String((req as any).user?.userId || '').trim();
    const userRole = normalizeRole((req as any).user?.role);
    const { professionalId } = req.body || {};
    const mockRuntime = isMockMode();

    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'CLIENT') {
        return res.status(403).json({ error: 'Apenas buscadores podem revogar consentimento clínico.' });
    }
    if (!professionalId) {
        return res.status(400).json({ error: 'patientId/professionalId inválido.' });
    }

    await AuditService.logAccess(patientId, `revoke:${professionalId}`, 'REVOKE_ACCESS', 'SUCCESS');

    if (mockRuntime) {
        if (STRICT_RECORD_CONSENT) {
            mockConsentStore.set(consentKey(patientId, String(professionalId)), 'REVOKED');
        }
        return res.json({
            success: true,
            message: `Access revoked from ${professionalId}`,
            consent: { patientId, professionalId, status: 'REVOKED', mock: true },
        });
    }

    await prisma.profileLink.upsert({
        where: {
            source_id_target_id_type: {
                source_id: patientId,
                target_id: String(professionalId),
                type: CONSENT_LINK_TYPE,
            },
        },
        update: {
            status: 'revoked',
        },
        create: {
            source_id: patientId,
            target_id: String(professionalId),
            type: CONSENT_LINK_TYPE,
            status: 'revoked',
        },
    });

    return res.json({
        success: true,
        consent: { patientId, professionalId: String(professionalId), status: 'REVOKED' },
    });
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
