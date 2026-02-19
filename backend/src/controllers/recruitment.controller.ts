import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async.middleware';
import { interactionService } from '../services/interaction.service';
import { interactionReceiptService } from '../services/interactionReceipt.service';

const applySchema = z.object({
  vacancyId: z.string().uuid().or(z.string().min(1)),
  notes: z.string().max(1000).optional(),
});
const scheduleInterviewSchema = z.object({
  scheduledFor: z.string().min(8),
  guardianId: z.string().uuid().optional(),
});
const interviewResponseSchema = z.object({
  decision: z.enum(['ACCEPT', 'DECLINE']),
  note: z.string().max(1000).optional(),
});
const decisionSchema = z.object({
  decision: z.enum(['HIRED', 'REJECTED']),
  note: z.string().max(1000).optional(),
});
const normalizeRole = (value?: string) => String(value || '').trim().toUpperCase();
const isAdmin = (role?: string) => normalizeRole(role) === 'ADMIN';

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = String((req as any).user?.userId || '').trim();
  const { vacancyId, notes } = applySchema.parse(req.body || {});

  const vacancy = await prisma.vacancy.findUnique({
    where: { id: String(vacancyId) },
    select: { id: true, title: true, space_id: true, status: true },
  });
  if (!vacancy) return res.status(404).json({ error: 'Vaga não encontrada.', code: 'VACANCY_NOT_FOUND' });
  if (String(vacancy.status || '').toUpperCase() !== 'OPEN') {
    return res.status(409).json({ error: 'Vaga indisponível para candidatura.', code: 'VACANCY_CLOSED' });
  }

  const existing = await prisma.recruitmentApplication.findUnique({
    where: { vacancy_id_candidate_id: { vacancy_id: vacancy.id, candidate_id: userId } },
    select: { id: true, status: true },
  });
  if (existing) {
    return res.status(409).json({ error: 'Você já possui candidatura para esta vaga.', code: 'APPLICATION_ALREADY_EXISTS', applicationId: existing.id, status: existing.status });
  }

  const application = await prisma.recruitmentApplication.create({
    data: { vacancy_id: vacancy.id, candidate_id: userId, space_id: vacancy.space_id, notes: notes || null, status: 'APPLIED' },
  });

  try {
    await interactionService.emitRecruitmentApplication({ applicationId: application.id, candidateId: userId, spaceId: vacancy.space_id, vacancyTitle: vacancy.title });
  } catch (error) {
    interactionService.logInteractionFailure('recruitment.application.created', error, { requestId: req.requestId, applicationId: application.id });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'RECRUITMENT_APPLICATION', entityId: application.id, action: 'APPLY', actorId: userId,
    status: 'COMPLETED', nextStep: 'SPACE_REVIEW', requestId: req.requestId, payload: { vacancyId: vacancy.id, spaceId: vacancy.space_id },
  });
  return res.status(201).json({ code: 'APPLICATION_CREATED', application, actionReceipt });
});

export const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const actorRole = String((req as any).user?.role || '').trim();
  const { id } = req.params;
  const { scheduledFor, guardianId } = scheduleInterviewSchema.parse(req.body || {});

  const application = await prisma.recruitmentApplication.findUnique({
    where: { id: String(id) },
    include: { vacancy: { select: { id: true, title: true, space_id: true } } },
  });
  if (!application) return res.status(404).json({ error: 'Candidatura não encontrada.', code: 'APPLICATION_NOT_FOUND' });
  if (!isAdmin(actorRole) && application.space_id !== actorId) {
    return res.status(403).json({ error: 'Sem permissão para agendar entrevista.', code: 'FORBIDDEN' });
  }

  const resolvedGuardianId = String(guardianId || application.candidate_id);
  const interview = await prisma.interview.upsert({
    where: { application_id: application.id },
    create: { application_id: application.id, space_id: application.space_id, guardian_id: resolvedGuardianId, scheduled_for: new Date(scheduledFor), status: 'PENDING_RESPONSE' },
    update: { guardian_id: resolvedGuardianId, scheduled_for: new Date(scheduledFor), status: 'PENDING_RESPONSE', response_note: null, responded_at: null },
  });
  await prisma.recruitmentApplication.update({ where: { id: application.id }, data: { status: 'INTERVIEW_INVITED' } });

  try {
    await interactionService.emitRecruitmentInterviewInvite({ interviewId: interview.id, spaceId: application.space_id, guardianId: interview.guardian_id, scheduledFor: interview.scheduled_for.toISOString() });
  } catch (error) {
    interactionService.logInteractionFailure('recruitment.interview.invited', error, { requestId: req.requestId, interviewId: interview.id });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'INTERVIEW', entityId: interview.id, action: 'INVITE', actorId, status: 'COMPLETED', nextStep: 'GUARDIAN_RESPONSE',
    requestId: req.requestId, payload: { applicationId: application.id, guardianId: interview.guardian_id, scheduledFor: interview.scheduled_for.toISOString() },
  });
  return res.json({ code: 'INTERVIEW_INVITED', interview, actionReceipt });
});

export const respondInterview = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const { id } = req.params;
  const { decision, note } = interviewResponseSchema.parse(req.body || {});

  const interview = await prisma.interview.findUnique({ where: { id: String(id) }, include: { application: true } });
  if (!interview) return res.status(404).json({ error: 'Entrevista não encontrada.', code: 'INTERVIEW_NOT_FOUND' });
  if (interview.guardian_id !== actorId) return res.status(403).json({ error: 'Sem permissão para responder esta entrevista.', code: 'FORBIDDEN' });

  const accepted = decision === 'ACCEPT';
  const updatedInterview = await prisma.interview.update({
    where: { id: interview.id },
    data: { status: accepted ? 'ACCEPTED' : 'DECLINED', response_note: note || null, responded_at: new Date() },
  });
  await prisma.recruitmentApplication.update({ where: { id: interview.application_id }, data: { status: accepted ? 'INTERVIEW_ACCEPTED' : 'REJECTED' } });

  try {
    await interactionService.emitRecruitmentInterviewResponse({ interviewId: interview.id, guardianId: actorId, spaceId: interview.space_id, accepted });
  } catch (error) {
    interactionService.logInteractionFailure('recruitment.interview.response', error, { requestId: req.requestId, interviewId: interview.id });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'INTERVIEW', entityId: interview.id, action: 'RESPOND', actorId, status: 'COMPLETED',
    nextStep: accepted ? 'SPACE_DECISION' : 'APPLICATION_CLOSED', requestId: req.requestId, payload: { decision, note: note || null },
  });
  return res.json({ code: accepted ? 'INTERVIEW_ACCEPTED' : 'INTERVIEW_DECLINED', interview: updatedInterview, actionReceipt });
});

export const decideApplication = asyncHandler(async (req: Request, res: Response) => {
  const actorId = String((req as any).user?.userId || '').trim();
  const actorRole = String((req as any).user?.role || '').trim();
  const { id } = req.params;
  const { decision, note } = decisionSchema.parse(req.body || {});

  const application = await prisma.recruitmentApplication.findUnique({
    where: { id: String(id) },
    select: { id: true, candidate_id: true, space_id: true, status: true, notes: true },
  });
  if (!application) return res.status(404).json({ error: 'Candidatura não encontrada.', code: 'APPLICATION_NOT_FOUND' });
  if (!isAdmin(actorRole) && application.space_id !== actorId) {
    return res.status(403).json({ error: 'Sem permissão para decidir esta candidatura.', code: 'FORBIDDEN' });
  }

  const updated = await prisma.recruitmentApplication.update({
    where: { id: application.id },
    data: { status: decision, notes: note ? `${application.notes ? `${application.notes}\n` : ''}${note}` : application.notes, decided_at: new Date(), decided_by: actorId },
  });

  try {
    await interactionService.emitRecruitmentDecision({ applicationId: application.id, actorId, candidateId: application.candidate_id, decision });
  } catch (error) {
    interactionService.logInteractionFailure('recruitment.application.decision', error, { requestId: req.requestId, applicationId: application.id });
  }

  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'RECRUITMENT_APPLICATION', entityId: application.id, action: 'DECIDE', actorId, status: 'COMPLETED',
    nextStep: decision === 'HIRED' ? 'ONBOARDING' : 'CLOSED', requestId: req.requestId, payload: { decision, candidateId: application.candidate_id },
  });
  return res.json({ code: decision === 'HIRED' ? 'APPLICATION_HIRED' : 'APPLICATION_REJECTED', application: updated, actionReceipt });
});

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const userId = String((req as any).user?.userId || '').trim();
  const role = normalizeRole((req as any).user?.role);
  const scope = String(req.query.scope || '').trim().toLowerCase();

  const where = (scope === 'candidate' || role === 'PROFESSIONAL' || role === 'CLIENT')
    ? { candidate_id: userId }
    : { space_id: userId };

  const applications = await prisma.recruitmentApplication.findMany({
    where,
    include: {
      vacancy: { select: { id: true, title: true, status: true } },
      interviews: { orderBy: { created_at: 'desc' } },
    },
    orderBy: { created_at: 'desc' },
  });
  return res.json(applications);
});
