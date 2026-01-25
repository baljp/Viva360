"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIn = exports.getQuests = exports.getStatus = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const cache_1 = require("../lib/cache");
const getStatus = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const cacheKey = `status:${userId}`;
    const cached = await (0, cache_1.cacheGet)(cacheKey);
    if (cached)
        return res.json(cached);
    const profile = await prisma_1.default.profile.findUnique({ where: { id: userId } });
    if (!profile)
        return res.status(404).json({ error: 'Profile not found' });
    const data = {
        karma: profile.karma,
        streak: profile.streak,
        multiplier: profile.multiplier,
        plant: {
            xp: profile.plant_xp,
            stage: profile.plant_stage
        }
    };
    await (0, cache_1.cacheSet)(cacheKey, data, 30); // 30s Cache
    return res.json(data);
};
exports.getStatus = getStatus;
const getQuests = async (req, res) => {
    // Return static quests for stress test
    return res.json([
        { id: 'q1', title: 'Morning Meditation', reward: 50, completed: false },
        { id: 'q2', title: 'Drink Water', reward: 10, completed: true },
        { id: 'q3', title: 'Journaling', reward: 30, completed: false }
    ]);
};
exports.getQuests = getQuests;
const checkIn = async (req, res) => {
    const userId = req.user?.userId;
    const { mood } = req.body;
    const profile = await prisma_1.default.profile.update({
        where: { id: userId },
        data: {
            streak: { increment: 1 },
            karma: { increment: 20 },
            plant_xp: { increment: 15 }
        }
    });
    await (0, cache_1.cacheInvalidate)(`status:${userId}`);
    return res.json({ success: true, new_streak: profile.streak });
};
exports.checkIn = checkIn;
