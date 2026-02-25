import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/async.middleware';
import { notificationEngine } from '../services/notificationEngine.service';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { isMockMode } from '../services/supabase.service';
import { mockAdapter, makeMockRecord } from '../services/mockAdapter';

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
        select: { role: true, active_role: true, profile_roles: { select: { role: true } } },
    });
    if (!profile) return false;
    const roles = new Set<string>();
    roles.add(normalizeRole(profile.role));
    roles.add(normalizeRole(profile.active_role));
    (profile.profile_roles || []).forEach((entry) => roles.add(normalizeRole(entry.role)));
    return roles.has('PROFESSIONAL');
};

const hasActiveConsentForRecord = async (patientId: string, professionalId: string) => {
    if (isMockMode()) {
        return mockAdapter.records.consents.get(consentKey(patientId, professionalId)) === 'ACTIVE';
    }
    const consent = await prisma.profileLink.findUnique({
        where: { source_id_target_id_type: { source_id: patientId, target_id: professionalId, type: CONSENT_LINK_TYPE } },
        select: { status: true },
    }).catch((error: unknown) => {
        const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
        if (code === 'P2021' || code === 'P2022') return null;
        throw error;
    });
    if (consent) return ACTIVE_CONSENT_STATUSES.has(normalizeStatus(consent.status));
    if (STRICT_RECORD_CONSENT) return false;
    return hasLegacyProfessionalRelationship(patientId, professionalId);
};

const emitRecordNotifications = async (params: {
    actorId: string; patientId: string; professionalId: string; recordId: string; action: 'created' | 'updated'; type: string; content: string;
}) => {
    const redactedMeta = { contentLength: String(params.content || '').trim().length };
    await notificationEngine.emit({
        type: 'record.updated', actorId: params.actorId, targetUserId: params.patientId,
        entityType: 'record', entityId: params.recordId, data: { action: params.action, type: params.type, ...redactedMeta },
    });
    const professional = await prisma.profile.findUnique({ where: { id: params.professionalId }, select: { hub_id: true } }).catch(() => null);
    if (professional?.hub_id) {
        await notificationEngine.emit({
            type: 'record.updated.space', actorId: params.actorId, targetUserId: professional.hub_id,
            entityType: 'record', entityId: params.recordId, data: { action: params.action, type: params.type, ...redactedMeta },
        });
    }
};

export const createNote = asyncHandler(async (req: Request, res: Response) => {
    const proId = String(req.user?.userId || '').trim();
    const userRole = normalizeRole(req.user?.role);
    if (!proId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'PROFESSIONAL') return res.status(403).json({ error: 'Apenas guardiões podem atualizar prontuário.' });

    const { patientId, content, type } = createRecordSchema.parse(req.body || {});

    if (isMockMode()) {
        if (patientId !== proId) {
            const consentGranted = mockAdapter.records.consents.get(consentKey(patientId, proId)) === 'ACTIVE';
            if (!consentGranted) return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente não concedeu consentimento para este prontuário.' });
        }
        const now = new Date().toISOString();
        const record: MockRecord = {
            id: `mock-record-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            patient_id: patientId,
            professional_id: proId,
            content,
            type,
            created_at: now,
            updated_at: now,
        };
        mockAdapter.records.records.set(record.id, record);
        return res.status(201).json(record);
    }

    if (patientId !== proId) {
        const consentGranted = await hasActiveConsentForRecord(patientId, proId);
        if (!consentGranted) return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente não concedeu consentimento para este prontuário.' });
    }

    await AuditService.logAccess(proId, `patient:${patientId}`, 'WRITE_RECORD', 'SUCCESS', `Type: ${type}`);
    const record = await prisma.record.create({ data: { patient_id: patientId, professional_id: proId, content, type } });

    emitRecordNotifications({ actorId: proId, patientId, professionalId: proId, recordId: record.id, action: 'created', type, content })
        .catch((error) => { logger.warn('records.emit_notifications_failed', { message: (error as any)?.message || String(error) }); });

    return res.status(201).json(record);
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
    const requestorId = String(req.user?.userId || '').trim();
    const targetPatientId = (req.query?.patientId as string) || (req.params?.patientId as string) || requestorId;
    const userRole = normalizeRole(req.user?.role);
    if (!requestorId || !targetPatientId) return res.status(401).json({ error: 'Unauthorized' });

    if (userRole === 'ADMIN') {
        logger.warn('lgpd.admin_records_access_denied', { requestorId });
        return res.status(403).json({ error: 'LGPD_VIOLATION: Admin cannot access sensitive health records.' });
    }
    if (userRole === 'CLIENT' && targetPatientId !== requestorId) {
        return res.status(403).json({ error: 'Sem permissão para acessar prontuário de outra pessoa.' });
    }
    if (userRole === 'PROFESSIONAL' && targetPatientId !== requestorId) {
        const consentGranted = await hasActiveConsentForRecord(targetPatientId, requestorId);
        if (!consentGranted) return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente não concedeu consentimento para este prontuário.' });
    }

    if (isMockMode()) {
        const records = Array.from(mockAdapter.records.records.values())
            .filter((record) => {
                if (record.patient_id !== targetPatientId) return false;
                if (userRole === 'PROFESSIONAL' && targetPatientId !== requestorId) return record.professional_id === requestorId;
                return true;
            })
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        return res.json(records);
    }

    await AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');
    const where: Record<string, unknown> = { patient_id: targetPatientId };
    if (userRole === 'PROFESSIONAL' && targetPatientId !== requestorId) where.professional_id = requestorId;
    if (userRole === 'SPACE') where.professional = { is: { hub_id: requestorId } };

    const records = await prisma.record.findMany({ where, orderBy: { created_at: 'desc' } });
    return res.json(records);
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
    const actorId = String(req.user?.userId || '').trim();
    const userRole = normalizeRole(req.user?.role);
    const recordId = String(req.params?.recordId || '').trim();
    if (!actorId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'PROFESSIONAL') return res.status(403).json({ error: 'Apenas guardiões podem editar prontuário.' });

    const payload = updateRecordSchema.parse(req.body || {});
    const existing = await prisma.record.findUnique({ where: { id: recordId }, select: { id: true, professional_id: true, patient_id: true, content: true, type: true } });
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado.' });
    if (existing.professional_id !== actorId) return res.status(403).json({ error: 'Sem permissão para editar este registro.' });

    if (existing.patient_id !== actorId) {
        const consentGranted = await hasActiveConsentForRecord(existing.patient_id, actorId);
        if (!consentGranted) return res.status(403).json({ error: 'CONSENT_REQUIRED: paciente revogou ou não concedeu consentimento.' });
    }

    const updated = await prisma.record.update({ where: { id: recordId }, data: { content: payload.content ?? undefined, type: payload.type ?? undefined } });
    emitRecordNotifications({ actorId, patientId: existing.patient_id, professionalId: existing.professional_id, recordId: existing.id, action: 'updated', type: updated.type, content: updated.content })
        .catch((error) => { logger.warn('records.emit_notifications_failed', { message: (error as any)?.message || String(error) }); });
    await AuditService.logAccess(actorId, `record:${recordId}`, 'UPDATE_RECORD', 'SUCCESS', `Type: ${updated.type}`);
    return res.json(updated);
});

export const grantAccess = asyncHandler(async (req: Request, res: Response) => {
    const patientId = String(req.user?.userId || '').trim();
    const userRole = normalizeRole(req.user?.role);
    const professionalId = String(req.body?.professionalId || '').trim();
    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'CLIENT') return res.status(403).json({ error: 'Apenas buscadores podem conceder consentimento clínico.' });
    if (!professionalId) return res.status(400).json({ error: 'professionalId inválido.' });
    if (professionalId === patientId) return res.status(400).json({ error: 'Não é possível conceder consentimento para si mesmo.' });

    if (isMockMode()) {
        mockAdapter.records.consents.set(consentKey(patientId, professionalId), 'ACTIVE');
        return res.json({ success: true, consent: { patientId, professionalId, status: 'ACTIVE' } });
    }

    const isProfessional = await isProfessionalRoleProfile(professionalId);
    if (!isProfessional) return res.status(404).json({ error: 'Profissional não encontrado para consentimento.' });

    await AuditService.logAccess(patientId, `grant:${professionalId}`, 'GRANT_ACCESS', 'SUCCESS');
    await prisma.profileLink.upsert({
        where: { source_id_target_id_type: { source_id: patientId, target_id: professionalId, type: CONSENT_LINK_TYPE } },
        update: { status: 'active' },
        create: { source_id: patientId, target_id: professionalId, type: CONSENT_LINK_TYPE, status: 'active' },
    });
    return res.json({ success: true, consent: { patientId, professionalId, status: 'ACTIVE' } });
});

export const revokeAccess = asyncHandler(async (req: Request, res: Response) => {
    const patientId = String(req.user?.userId || '').trim();
    const userRole = normalizeRole(req.user?.role);
    const professionalId = String(req.body?.professionalId || '').trim();
    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });
    if (userRole !== 'CLIENT') return res.status(403).json({ error: 'Apenas buscadores podem revogar consentimento clínico.' });
    if (!professionalId) return res.status(400).json({ error: 'professionalId inválido.' });

    if (isMockMode()) {
        mockAdapter.records.consents.set(consentKey(patientId, professionalId), 'REVOKED');
        return res.json({ success: true, consent: { patientId, professionalId, status: 'REVOKED' } });
    }

    await AuditService.logAccess(patientId, `revoke:${professionalId}`, 'REVOKE_ACCESS', 'SUCCESS');
    await prisma.profileLink.upsert({
        where: { source_id_target_id_type: { source_id: patientId, target_id: professionalId, type: CONSENT_LINK_TYPE } },
        update: { status: 'revoked' },
        create: { source_id: patientId, target_id: professionalId, type: CONSENT_LINK_TYPE, status: 'revoked' },
    });
    return res.json({ success: true, consent: { patientId, professionalId, status: 'REVOKED' } });
});

export const exportData = asyncHandler(async (req: Request, res: Response) => {
    const userId = String(req.user?.userId || '').trim();
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await AuditService.logAccess(userId, 'all_data', 'EXPORT_DATA', 'SUCCESS');

    const [profile, records, transactions] = await Promise.all([
        prisma.profile.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, created_at: true },
        }),
        prisma.record.findMany({
            where: { patient_id: userId },
            select: { id: true, type: true, created_at: true },
            orderBy: { created_at: 'desc' },
        }),
        prisma.transaction.findMany({
            where: { user_id: userId },
            select: { id: true, amount: true, description: true, status: true, date: true },
            orderBy: { date: 'desc' },
            take: 200,
        }).catch(() => []),
    ]);

    return res.json({
        exportedAt: new Date().toISOString(),
        profile,
        records: records.map(r => ({ ...r, content: '[REDACTED — disponível sob solicitação]' })),
        transactions: transactions.map(t => ({ ...t, amount: Number(t.amount), date: t.date?.toISOString() })),
    });
});
