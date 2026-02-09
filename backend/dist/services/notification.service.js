"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("./supabase.service");
// For Notifications, given its simplicity, we might merge Repo logic here for now
// or keep it strictly separated. Let's start with Service encapsulating Prisma.
class NotificationService {
    async list(userId) {
        if ((0, supabase_service_1.isMockMode)()) {
            return [
                { id: 'n1', title: 'Bem-vindo', message: 'Eco-sistema Viva360', timestamp: new Date().toISOString() }
            ];
        }
        return await prisma_1.default.notification.findMany({
            where: { user_id: userId },
            orderBy: { timestamp: 'desc' }
        });
    }
    async sendPushSimulation(userId, title, message) {
        const { notificationQueue } = await Promise.resolve().then(() => __importStar(require('../lib/queue')));
        // 1. Store in DB (Sync for immediate history view)
        await prisma_1.default.notification.create({
            data: {
                user_id: userId,
                title,
                message,
                type: 'push_sim',
            }
        });
        // 2. Offload External Integration to Queue
        try {
            await notificationQueue.add('send_push', { userId, title, message });
        }
        catch (e) {
            console.error(`❌ [NOTIF] queue failed:`, e);
        }
    }
    async markAsRead(userId, notificationId) {
        if ((0, supabase_service_1.isMockMode)()) {
            return { success: true };
        }
        await prisma_1.default.notification.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
            },
            data: {
                read: true,
            },
        });
        return { success: true };
    }
    async markAllAsRead(userId) {
        if ((0, supabase_service_1.isMockMode)()) {
            return { success: true };
        }
        await prisma_1.default.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true },
        });
        return { success: true };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
