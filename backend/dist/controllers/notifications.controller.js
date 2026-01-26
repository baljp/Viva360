"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushSimulation = exports.list = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const list = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'n1', title: 'Bem-vindo', message: 'Eco-sistema Viva360', timestamp: new Date().toISOString() }
        ]);
    }
    const notifications = await prisma_1.default.notification.findMany({
        where: { user_id: userId },
        orderBy: { timestamp: 'desc' }
    });
    return res.json(notifications);
};
exports.list = list;
const sendPushSimulation = async (userId, title, message) => {
    if ((0, supabase_service_1.isMockMode)()) {
        console.log(`[MOCK PUSH] To: ${userId} | "${title}: ${message}"`);
        return;
    }
    // 1. Store in DB
    await prisma_1.default.notification.create({
        data: {
            user_id: userId,
            title,
            message,
            type: 'push_sim',
        }
    });
    // 2. Simulate Push (Log to console as "Mobile Push Service")
    console.log(`[MOBILE PUSH] To: ${userId} | "${title}: ${message}"`);
    // Future: Integraiton with Expo/FCM would go here
};
exports.sendPushSimulation = sendPushSimulation;
