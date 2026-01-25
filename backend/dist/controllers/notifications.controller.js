"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushSimulation = exports.list = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const list = async (req, res) => {
    const userId = req.user?.userId;
    const notifications = await prisma_1.default.notification.findMany({
        where: { user_id: userId },
        orderBy: { timestamp: 'desc' }
    });
    return res.json(notifications);
};
exports.list = list;
const sendPushSimulation = async (userId, title, message) => {
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
