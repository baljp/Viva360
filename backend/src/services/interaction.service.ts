import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { notificationEngine } from './notificationEngine.service';
import { logger } from '../lib/logger';

type CheckoutContext = 'BAZAR' | 'TRIBO' | 'RECRUTAMENTO' | 'ESCAMBO' | 'AGENDA' | 'GERAL';

const normalizeCheckoutContext = (value?: string): CheckoutContext => {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'BAZAR') return 'BAZAR';
  if (normalized === 'TRIBO') return 'TRIBO';
  if (normalized === 'RECRUTAMENTO') return 'RECRUTAMENTO';
  if (normalized === 'ESCAMBO') return 'ESCAMBO';
  if (normalized === 'AGENDA') return 'AGENDA';
  return 'GERAL';
};

const contextToLabel = (context: CheckoutContext): string => {
  if (context === 'BAZAR') return 'Bazar';
  if (context === 'TRIBO') return 'Tribo';
  if (context === 'RECRUTAMENTO') return 'Recrutamento';
  if (context === 'ESCAMBO') return 'Escambo';
  if (context === 'AGENDA') return 'Agenda';
  return 'Checkout';
};

const withInteractionPayload = (
  payload: Record<string, unknown>,
  meta: { entityType: string; entityId: string; action: string; recipientRole: string }
) => ({
  ...payload,
  entityType: meta.entityType,
  entityId: meta.entityId,
  action: meta.action,
  recipientRole: meta.recipientRole,
});

export class InteractionService {
  async emitCheckoutConfirmation(params: {
    buyerId: string;
    receiverId?: string | null;
    extraRecipients?: string[];
    amount: number;
    contextType?: string;
    entityId: string;
    description?: string;
  }) {
    const confirmationId = randomUUID();
    const context = normalizeCheckoutContext(params.contextType);
    const sentTo = new Set<string>([params.buyerId]);
    const contextLabel = contextToLabel(context);

    await notificationEngine.emit({
      type: 'checkout.confirmed',
      actorId: params.buyerId,
      targetUserId: params.buyerId,
      entityType: 'checkout',
      entityId: params.entityId,
      data: withInteractionPayload({
        amount: Number(params.amount || 0),
        context: contextLabel,
        confirmationId,
      }, {
        entityType: 'checkout',
        entityId: params.entityId,
        action: 'PAY_CONFIRMED',
        recipientRole: 'BUYER',
      }),
    });

    if (params.receiverId && params.receiverId !== params.buyerId) {
      sentTo.add(params.receiverId);
      await notificationEngine.emit({
        type: 'payment.received',
        actorId: params.buyerId,
        targetUserId: params.receiverId,
        entityType: 'checkout',
        entityId: params.entityId,
        data: withInteractionPayload({
          amount: Number(params.amount || 0),
          context: contextLabel,
          description: params.description || 'Transação Viva360',
        }, {
          entityType: 'checkout',
          entityId: params.entityId,
          action: 'PAYMENT_RECEIVED',
          recipientRole: 'COUNTERPARTY',
        }),
      });
    }

    for (const recipient of params.extraRecipients || []) {
      const targetId = String(recipient || '').trim();
      if (!targetId || sentTo.has(targetId)) continue;
      sentTo.add(targetId);
      await notificationEngine.emit({
        type: 'checkout.confirmed',
        actorId: params.buyerId,
        targetUserId: targetId,
        entityType: 'checkout',
        entityId: params.entityId,
        data: withInteractionPayload({
          amount: Number(params.amount || 0),
          context: contextLabel,
          confirmationId,
        }, {
          entityType: 'checkout',
          entityId: params.entityId,
          action: 'PAY_CONFIRMED',
          recipientRole: 'EXTRA_RECIPIENT',
        }),
      });
    }

    return {
      confirmationId,
      context: contextLabel,
      sentTo: Array.from(sentTo),
      message: `Checkout confirmado para ${contextLabel}.`,
    };
  }

  async emitAppointmentLifecycle(params: {
    appointmentId: string;
    clientId: string;
    professionalId?: string | null;
    serviceName: string;
    isoDate: string;
  }) {
    const sentTo = new Set<string>([params.clientId]);

    if (params.professionalId) {
      sentTo.add(params.professionalId);
      await notificationEngine.emit({
        type: 'appointment.created',
        actorId: params.clientId,
        targetUserId: params.professionalId,
        entityType: 'appointment',
        entityId: params.appointmentId,
        data: withInteractionPayload({
          serviceName: params.serviceName,
          date: params.isoDate,
        }, {
          entityType: 'appointment',
          entityId: params.appointmentId,
          action: 'CREATED',
          recipientRole: 'PROFESSIONAL',
        }),
      });
    }

    await notificationEngine.emit({
      type: 'appointment.confirmed',
      actorId: params.professionalId || params.clientId,
      targetUserId: params.clientId,
      entityType: 'appointment',
      entityId: params.appointmentId,
      data: withInteractionPayload({
        serviceName: params.serviceName,
        date: params.isoDate,
      }, {
        entityType: 'appointment',
        entityId: params.appointmentId,
        action: 'CONFIRMED',
        recipientRole: 'CLIENT',
      }),
    });

    // If guardian belongs to a sanctuary, notify sanctuary and block calendar.
    if (params.professionalId) {
      const professional = await prisma.profile.findUnique({
        where: { id: params.professionalId },
        select: { id: true, hub_id: true, name: true },
      });

      if (professional?.hub_id) {
        sentTo.add(professional.hub_id);
        await notificationEngine.emit({
          type: 'appointment.space_blocked',
          actorId: params.clientId,
          targetUserId: professional.hub_id,
          entityType: 'appointment',
          entityId: params.appointmentId,
          data: withInteractionPayload({
            serviceName: params.serviceName,
            guardianName: professional.name || 'Guardião',
            date: params.isoDate,
          }, {
            entityType: 'appointment',
            entityId: params.appointmentId,
            action: 'SPACE_BLOCKED',
            recipientRole: 'SPACE',
          }),
        });
      }
    }

    return {
      sentTo: Array.from(sentTo),
      message: 'Agendamento confirmado e notificado para todos os envolvidos.',
    };
  }

  async emitAppointmentRescheduled(params: {
    appointmentId: string;
    clientId: string;
    professionalId?: string | null;
    serviceName: string;
    isoDate: string;
  }) {
    const sentTo = new Set<string>([params.clientId]);

    if (params.professionalId) {
      sentTo.add(params.professionalId);
      await notificationEngine.emit({
        type: 'appointment.rescheduled',
        actorId: params.clientId,
        targetUserId: params.professionalId,
        entityType: 'appointment',
        entityId: params.appointmentId,
        data: withInteractionPayload({ serviceName: params.serviceName, date: params.isoDate }, {
          entityType: 'appointment',
          entityId: params.appointmentId,
          action: 'RESCHEDULED',
          recipientRole: 'PROFESSIONAL',
        }),
      });
    }

    await notificationEngine.emit({
      type: 'appointment.rescheduled',
      actorId: params.professionalId || params.clientId,
      targetUserId: params.clientId,
      entityType: 'appointment',
      entityId: params.appointmentId,
      data: withInteractionPayload({ serviceName: params.serviceName, date: params.isoDate }, {
        entityType: 'appointment',
        entityId: params.appointmentId,
        action: 'RESCHEDULED',
        recipientRole: 'CLIENT',
      }),
    });

    if (params.professionalId) {
      const professional = await prisma.profile.findUnique({
        where: { id: params.professionalId },
        select: { hub_id: true, name: true },
      });

      if (professional?.hub_id) {
        sentTo.add(professional.hub_id);
        await notificationEngine.emit({
          type: 'appointment.space_rescheduled',
          actorId: params.clientId,
          targetUserId: professional.hub_id,
          entityType: 'appointment',
          entityId: params.appointmentId,
          data: withInteractionPayload({
            serviceName: params.serviceName,
            date: params.isoDate,
            guardianName: professional.name || 'Guardião',
          }, {
            entityType: 'appointment',
            entityId: params.appointmentId,
            action: 'SPACE_RESCHEDULED',
            recipientRole: 'SPACE',
          }),
        });
      }
    }

    return {
      sentTo: Array.from(sentTo),
      message: 'Agendamento reagendado com notificação para as partes.',
    };
  }

  async emitAppointmentCancelled(params: {
    appointmentId: string;
    clientId: string;
    professionalId?: string | null;
    isoDate: string;
  }) {
    const sentTo = new Set<string>([params.clientId]);
    if (params.professionalId) {
      sentTo.add(params.professionalId);
      await notificationEngine.emit({
        type: 'appointment.cancelled',
        actorId: params.clientId,
        targetUserId: params.professionalId,
        entityType: 'appointment',
        entityId: params.appointmentId,
        data: withInteractionPayload({ date: params.isoDate }, {
          entityType: 'appointment',
          entityId: params.appointmentId,
          action: 'CANCELLED',
          recipientRole: 'PROFESSIONAL',
        }),
      });
    }

    await notificationEngine.emit({
      type: 'appointment.cancelled',
      actorId: params.professionalId || params.clientId,
      targetUserId: params.clientId,
      entityType: 'appointment',
      entityId: params.appointmentId,
      data: withInteractionPayload({ date: params.isoDate }, {
        entityType: 'appointment',
        entityId: params.appointmentId,
        action: 'CANCELLED',
        recipientRole: 'CLIENT',
      }),
    });

    return {
      sentTo: Array.from(sentTo),
      message: 'Agendamento cancelado com notificação das partes.',
    };
  }

  async emitTribeInvite(params: { hubId: string; email: string; inviteId: string }) {
    const target = await prisma.profile.findFirst({
      where: { email: String(params.email || '').trim().toLowerCase() },
      select: { id: true },
    });

    if (!target?.id) {
      return { sent: false, reason: 'TARGET_PROFILE_NOT_FOUND' };
    }

    await notificationEngine.emit({
      type: 'tribe.invite',
      actorId: params.hubId,
      targetUserId: target.id,
      entityType: 'tribe_invite',
      entityId: params.inviteId,
      data: withInteractionPayload({
        email: params.email,
      }, {
        entityType: 'tribe_invite',
        entityId: params.inviteId,
        action: 'INVITED',
        recipientRole: 'TARGET_MEMBER',
      }),
    });

    return { sent: true, targetUserId: target.id };
  }

  async emitEscamboOffer(params: { providerId: string; requesterId: string; offerId: string; description?: string | null }) {
    await notificationEngine.emit({
      type: 'escambo.created',
      actorId: params.providerId,
      targetUserId: params.requesterId,
      entityType: 'swap_offer',
      entityId: params.offerId,
      data: withInteractionPayload({
        offer: params.description || 'Nova proposta de escambo',
      }, {
        entityType: 'swap_offer',
        entityId: params.offerId,
        action: 'CREATED',
        recipientRole: 'REQUESTER',
      }),
    });

    return { sent: true };
  }

  async emitEscamboDecision(params: {
    actorId: string;
    counterpartId: string;
    offerId: string;
    type: 'accepted' | 'rejected' | 'countered' | 'completed';
    counterOffer?: string | null;
  }) {
    const eventTypeByDecision = {
      accepted: 'escambo.accepted',
      rejected: 'escambo.rejected',
      countered: 'escambo.countered',
      completed: 'escambo.completed',
    } as const;

    await notificationEngine.emit({
      type: eventTypeByDecision[params.type],
      actorId: params.actorId,
      targetUserId: params.counterpartId,
      entityType: 'swap_offer',
      entityId: params.offerId,
      data: withInteractionPayload({
        counterOffer: params.counterOffer || undefined,
      }, {
        entityType: 'swap_offer',
        entityId: params.offerId,
        action: String(params.type || '').toUpperCase(),
        recipientRole: 'COUNTERPARTY',
      }),
    });

    return { sent: true };
  }

  async emitRecruitmentApplication(params: {
    applicationId: string;
    candidateId: string;
    spaceId: string;
    vacancyTitle: string;
  }) {
    await notificationEngine.emit({
      type: 'recruitment.application.created',
      actorId: params.candidateId,
      targetUserId: params.spaceId,
      entityType: 'recruitment_application',
      entityId: params.applicationId,
      data: { vacancyTitle: params.vacancyTitle },
    });
    return { sent: true };
  }

  async emitRecruitmentInterviewInvite(params: {
    interviewId: string;
    spaceId: string;
    guardianId: string;
    scheduledFor: string;
  }) {
    await notificationEngine.emit({
      type: 'recruitment.interview.invited',
      actorId: params.spaceId,
      targetUserId: params.guardianId,
      entityType: 'interview',
      entityId: params.interviewId,
      data: { scheduledFor: params.scheduledFor },
    });
    return { sent: true };
  }

  async emitRecruitmentInterviewResponse(params: {
    interviewId: string;
    guardianId: string;
    spaceId: string;
    accepted: boolean;
  }) {
    await notificationEngine.emit({
      type: params.accepted ? 'recruitment.interview.accepted' : 'recruitment.interview.declined',
      actorId: params.guardianId,
      targetUserId: params.spaceId,
      entityType: 'interview',
      entityId: params.interviewId,
      data: {},
    });
    return { sent: true };
  }

  async emitRecruitmentDecision(params: {
    applicationId: string;
    actorId: string;
    candidateId: string;
    decision: 'HIRED' | 'REJECTED';
  }) {
    await notificationEngine.emit({
      type: params.decision === 'HIRED' ? 'recruitment.application.hired' : 'recruitment.application.rejected',
      actorId: params.actorId,
      targetUserId: params.candidateId,
      entityType: 'recruitment_application',
      entityId: params.applicationId,
      data: {},
    });
    return { sent: true };
  }

  logInteractionFailure(label: string, error: unknown, metadata?: Record<string, unknown>) {
    logger.warn('interaction_emit_failed', {
      label,
      error: String((error as any)?.message || error),
      ...(metadata || {}),
    });
  }
}

export const interactionService = new InteractionService();
