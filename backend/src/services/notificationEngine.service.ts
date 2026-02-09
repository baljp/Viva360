import prisma from '../lib/prisma';
import { NotificationDispatcher } from './notification.dispatcher';

export interface NotificationEvent {
  type: string;
  actorId: string;
  targetUserId: string;
  entityType: string;
  entityId: string;
  data?: any;
}

// Mapping: Event Type -> Notification Title/Message
const EVENT_TEMPLATES: Record<string, { title: (data: any) => string; message: (data: any) => string }> = {
  'link.created': {
    title: () => 'Novo Convite',
    message: (data) => `Você recebeu um convite de conexão (${data.linkType}).`,
  },
  'link.accepted': {
    title: () => 'Convite Aceito',
    message: (data) => `Seu convite de conexão (${data.linkType}) foi aceito!`,
  },
  'escambo.created': {
    title: () => 'Proposta de Escambo',
    message: (data) => `Você recebeu uma proposta de escambo: ${data.offer}.`,
  },
  'escambo.accepted': {
    title: () => 'Escambo Aceito',
    message: () => 'Sua proposta de escambo foi aceita!',
  },
  'escambo.rejected': {
    title: () => 'Escambo Recusado',
    message: () => 'Sua proposta de escambo foi recusada.',
  },
  'escambo.countered': {
    title: () => 'Contraproposta de Escambo',
    message: (data) => data.counterOffer || 'Você recebeu uma contraproposta de escambo.',
  },
  'escambo.completed': {
    title: () => 'Escambo Concluído',
    message: () => 'Escambo concluído com confirmação para as duas partes.',
  },
  'appointment.created': {
    title: () => 'Novo Agendamento',
    message: (data) => `Você tem um novo agendamento: ${data.serviceName}.`,
  },
  'appointment.confirmed': {
    title: () => 'Agendamento Confirmado',
    message: (data) => `Seu agendamento foi confirmado para ${data.date}.`,
  },
  'appointment.cancelled': {
    title: () => 'Agendamento Cancelado',
    message: () => 'Um agendamento foi cancelado.',
  },
  'appointment.rescheduled': {
    title: () => 'Agendamento Reagendado',
    message: (data) => `Seu agendamento foi reagendado para ${data.date}.`,
  },
  'payment.received': {
    title: () => 'Pagamento Recebido',
    message: (data) => `Você recebeu R$ ${Number(data.amount || 0).toFixed(2)}.`,
  },
  'checkout.confirmed': {
    title: () => 'Checkout Confirmado',
    message: (data) => `Pagamento de ${data.context || 'Checkout'} confirmado. Protocolo ${data.confirmationId || '-'}.`,
  },
  'tribe.invite': {
    title: () => 'Convite para Tribo',
    message: () => 'Você recebeu um convite para participar de uma nova tribo.',
  },
  'appointment.space_blocked': {
    title: () => 'Agenda Atualizada',
    message: (data) => `${data.guardianName || 'Guardião'} recebeu marcação em ${data.date}. Agenda do santuário bloqueada.`,
  },
  'appointment.space_unblocked': {
    title: () => 'Agenda Liberada',
    message: (data) => `Bloqueio removido da agenda do santuário para ${data.date}.`,
  },
  'recruitment.application.created': {
    title: () => 'Nova Candidatura',
    message: () => 'Você recebeu uma nova candidatura para vaga.',
  },
  'recruitment.interview.invited': {
    title: () => 'Convite para Entrevista',
    message: (data) => `Você foi convidado para entrevista em ${data.scheduledFor}.`,
  },
  'recruitment.interview.accepted': {
    title: () => 'Entrevista Aceita',
    message: () => 'O convite de entrevista foi aceito.',
  },
  'recruitment.interview.declined': {
    title: () => 'Entrevista Recusada',
    message: () => 'O convite de entrevista foi recusado.',
  },
  'recruitment.application.hired': {
    title: () => 'Candidatura Aprovada',
    message: () => 'Parabéns! Sua candidatura foi aprovada.',
  },
  'recruitment.application.rejected': {
    title: () => 'Candidatura Encerrada',
    message: () => 'Sua candidatura foi encerrada neste ciclo.',
  },
  'chat.message': {
    title: () => 'Nova Mensagem',
    message: (data) => data.preview || 'Você recebeu uma nova mensagem.',
  },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class NotificationEngine {
  /**
   * Emit a notification event
   * Creates notification in DB and dispatches to channels
   */
  async emit(event: NotificationEvent): Promise<void> {
    const template = EVENT_TEMPLATES[event.type];
    
    if (!template) {
      console.warn(`[NotificationEngine] Unknown event type: ${event.type}`);
      return;
    }

    const title = template.title(event.data || {});
    const message = template.message(event.data || {});

    const targetUserId = String(event.targetUserId || '').trim();
    if (!UUID_REGEX.test(targetUserId)) {
      console.warn('[NotificationEngine] Skipping notification for non-UUID target:', targetUserId);
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    }).catch(() => null);
    if (!profile?.id) {
      console.warn('[NotificationEngine] Skipping notification for unknown target profile:', targetUserId);
      return;
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        user_id: targetUserId,
        type: this.mapEventTypeToNotifType(event.type),
        title,
        message,
        read: false,
      },
    });

    // Dispatch to external channels (email, push, whatsapp)
    try {
      await NotificationDispatcher.dispatch({
        userId: targetUserId,
        title,
        message,
        channels: ['IN_APP', 'PUSH'], // Default channels
        metadata: {
          eventType: event.type,
          entityType: event.entityType,
          entityId: event.entityId,
        },
      });
    } catch (err) {
      console.error('[NotificationEngine] Dispatch failed:', err);
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        user_id: userId,
        read: false,
      },
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
  }

  /**
   * Get notifications for user with pagination
   */
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<any[]> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    return prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  private mapEventTypeToNotifType(eventType: string): string {
    if (eventType.startsWith('link.') || eventType.startsWith('escambo.')) {
      return 'alert';
    }
    if (eventType.startsWith('chat.')) {
      return 'message';
    }
    if (eventType.startsWith('appointment.')) {
      return 'ritual';
    }
    if (eventType.startsWith('payment.') || eventType.startsWith('checkout.')) {
      return 'finance';
    }
    if (eventType.startsWith('recruitment.')) {
      return 'alert';
    }
    return 'alert';
  }
}

export const notificationEngine = new NotificationEngine();
