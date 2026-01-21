import prisma from '../config/database';
import { io } from '../server';

export type NotificationType = 
  | 'APPOINTMENT' 
  | 'MESSAGE' 
  | 'HEALTH' 
  | 'GAMIFICATION' 
  | 'RITUAL' 
  | 'MARKETPLACE' 
  | 'TRIBE' 
  | 'SYSTEM';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

interface NotificationPreferences {
  appointments: boolean;
  messages: boolean;
  health: boolean;
  gamification: boolean;
  ritual: boolean;
  marketplace: boolean;
  tribe: boolean;
  system: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

class NotificationService {
  /**
   * Create and send a notification
   */
  async create(params: CreateNotificationParams) {
    const { userId, type, title, message, actionUrl } = params;

    // Check user notification preferences
    const prefs = await this.getPreferences(userId);
    const typeKey = type.toLowerCase() as keyof NotificationPreferences;
    
    // Skip if user disabled this notification type
    if (prefs && !prefs[typeKey]) {
      return null;
    }

    // Check quiet hours
    if (prefs?.quietStart && prefs?.quietEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= prefs.quietStart && currentTime <= prefs.quietEnd) {
        // Queue for later (in production, use a job queue)
        console.log(`Notification queued for user ${userId} (quiet hours)`);
      }
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: this.mapTypeToEnum(type),
        title,
        message,
        actionUrl,
      },
    });

    // Send real-time push via WebSocket
    if (prefs?.pushEnabled !== false) {
      this.sendPush(userId, { id: notification.id, type, title, message, actionUrl });
    }

    // Send email (if enabled and in production)
    if (prefs?.emailEnabled && prefs?.emailDigest === 'INSTANT') {
      await this.sendEmail(userId, title, message);
    }

    return notification;
  }

  /**
   * Map custom type to Prisma enum
   */
  private mapTypeToEnum(type: NotificationType): any {
    const mapping: Record<NotificationType, string> = {
      APPOINTMENT: 'APPOINTMENT',
      MESSAGE: 'MESSAGE',
      HEALTH: 'ALERT',
      GAMIFICATION: 'RITUAL',
      RITUAL: 'RITUAL',
      MARKETPLACE: 'FINANCE',
      TRIBE: 'MESSAGE',
      SYSTEM: 'ALERT',
    };
    return mapping[type] || 'ALERT';
  }

  /**
   * Send push notification via WebSocket
   */
  private sendPush(userId: string, data: any) {
    try {
      io?.to(`user:${userId}`).emit('notification:new', data);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send email notification (placeholder - integrate with email provider)
   */
  private async sendEmail(userId: string, title: string, message: string) {
    // TODO: Integrate with SendGrid, AWS SES, or similar
    console.log(`[EMAIL] To: ${userId} | Subject: ${title} | Body: ${message}`);
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences & { quietStart?: string; quietEnd?: string; emailDigest?: string } | null> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Return default preferences
      return {
        appointments: true,
        messages: true,
        health: true,
        gamification: true,
        ritual: true,
        marketplace: true,
        tribe: true,
        system: true,
        pushEnabled: true,
        emailEnabled: true,
        emailDigest: 'INSTANT',
      };
    }

    return prefs as any;
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...preferences },
      update: preferences,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  /**
   * Get user's notifications with pagination
   */
  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount: unread,
    };
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  // ==========================================
  // Convenience methods for common notifications
  // ==========================================

  async notifyAppointmentBooked(userId: string, proName: string, date: string, time: string) {
    return this.create({
      userId,
      type: 'APPOINTMENT',
      title: 'Sessão Agendada',
      message: `Sua sessão com ${proName} foi confirmada para ${date} às ${time}`,
      actionUrl: '/appointments',
    });
  }

  async notifyAppointmentReminder(userId: string, proName: string, time: string) {
    return this.create({
      userId,
      type: 'APPOINTMENT',
      title: 'Lembrete de Sessão',
      message: `Sua sessão com ${proName} começa em ${time}`,
      actionUrl: '/appointments',
    });
  }

  async notifyNewMessage(userId: string, senderName: string) {
    return this.create({
      userId,
      type: 'MESSAGE',
      title: 'Nova Mensagem',
      message: `${senderName} enviou uma mensagem para você`,
      actionUrl: '/chat',
    });
  }

  async notifyAchievementUnlocked(userId: string, badgeName: string, karma: number) {
    return this.create({
      userId,
      type: 'GAMIFICATION',
      title: 'Conquista Desbloqueada! 🏆',
      message: `Você ganhou: ${badgeName} (+${karma} karma)`,
      actionUrl: '/achievements',
    });
  }

  async notifyStreakBonus(userId: string, days: number, karma: number) {
    return this.create({
      userId,
      type: 'GAMIFICATION',
      title: `🔥 Streak de ${days} dias!`,
      message: `Continue assim! +${karma} karma de bônus`,
      actionUrl: '/journey',
    });
  }

  async notifyTribeEnergy(userId: string, senderName: string, amount: number) {
    return this.create({
      userId,
      type: 'TRIBE',
      title: 'Energia Recebida ✨',
      message: `${senderName} enviou ${amount} de energia para você!`,
      actionUrl: '/tribe',
    });
  }

  async notifySoulPillPurchase(creatorId: string, pillName: string, buyerName: string, amount: number) {
    return this.create({
      userId: creatorId,
      type: 'MARKETPLACE',
      title: 'Venda na Farmácia da Alma! 💊',
      message: `${buyerName} adquiriu "${pillName}" - R$ ${amount.toFixed(2)}`,
      actionUrl: '/soul-pharmacy',
    });
  }

  async notifyRecordShared(userId: string, proName: string) {
    return this.create({
      userId,
      type: 'HEALTH',
      title: 'Prontuário Compartilhado',
      message: `Você deu acesso a ${proName} aos seus registros de saúde`,
      actionUrl: '/health-records',
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
