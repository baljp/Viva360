"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationEngine = exports.NotificationEngine = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notification_dispatcher_1 = require("./notification.dispatcher");
// Mapping: Event Type -> Notification Title/Message
const EVENT_TEMPLATES = {
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
class NotificationEngine {
    /**
     * Emit a notification event
     * Creates notification in DB and dispatches to channels
     */
    async emit(event) {
        const template = EVENT_TEMPLATES[event.type];
        if (!template) {
            console.warn(`[NotificationEngine] Unknown event type: ${event.type}`);
            return;
        }
        const title = template.title(event.data || {});
        const message = template.message(event.data || {});
        // Create in-app notification
        await prisma_1.default.notification.create({
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
            await notification_dispatcher_1.NotificationDispatcher.dispatch({
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
        }
        catch (err) {
            console.error('[NotificationEngine] Dispatch failed:', err);
        }
    }
    /**
     * Get unread notification count for user
     */
    async getUnreadCount(userId) {
        return prisma_1.default.notification.count({
            where: {
                user_id: userId,
                read: false,
            },
        });
    }
    /**
     * Mark notifications as read
     */
    async markAsRead(notificationIds) {
        await prisma_1.default.notification.updateMany({
            where: { id: { in: notificationIds } },
            data: { read: true },
        });
    }
    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId) {
        await prisma_1.default.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true },
        });
    }
    /**
     * Get notifications for user with pagination
     */
    async getNotifications(userId, options = {}) {
        const { limit = 20, offset = 0, unreadOnly = false } = options;
        return prisma_1.default.notification.findMany({
            where: {
                user_id: userId,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    mapEventTypeToNotifType(eventType) {
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
exports.NotificationEngine = NotificationEngine;
exports.notificationEngine = new NotificationEngine();
