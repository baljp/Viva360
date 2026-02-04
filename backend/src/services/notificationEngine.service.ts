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
  'payment.received': {
    title: () => 'Pagamento Recebido',
    message: (data) => `Você recebeu R$ ${data.amount.toFixed(2)}.`,
  },
  'chat.message': {
    title: () => 'Nova Mensagem',
    message: (data) => data.preview || 'Você recebeu uma nova mensagem.',
  },
};

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

    // Create in-app notification
    await prisma.notification.create({
      data: {
        user_id: event.targetUserId,
        type: this.mapEventTypeToNotifType(event.type),
        title,
        message,
        read: false,
      },
    });

    // Dispatch to external channels (email, push, whatsapp)
    try {
      await NotificationDispatcher.dispatch({
        userId: event.targetUserId,
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
    if (eventType.startsWith('payment.')) {
      return 'finance';
    }
    return 'alert';
  }
}

export const notificationEngine = new NotificationEngine();
