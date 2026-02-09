"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJournalStats = exports.listEntries = exports.createEntry = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const async_middleware_1 = require("../middleware/async.middleware");
const supabase_service_1 = require("../services/supabase.service");
const JOURNAL_EVENT_TYPE = 'JOURNAL_ENTRY';
const computeStreak = (dates) => {
    if (!dates.length)
        return 0;
    const uniqueDays = Array.from(new Set(dates.map((value) => new Date(value).toISOString().slice(0, 10)))).sort((a, b) => (a < b ? 1 : -1));
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const day of uniqueDays) {
        const expected = cursor.toISOString().slice(0, 10);
        if (day !== expected) {
            if (streak === 0) {
                const yesterday = new Date(cursor);
                yesterday.setDate(cursor.getDate() - 1);
                if (day !== yesterday.toISOString().slice(0, 10)) {
                    break;
                }
            }
            else {
                break;
            }
        }
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
};
exports.createEntry = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const payload = req.body || {};
    if ((0, supabase_service_1.isMockMode)()) {
        return res.status(201).json({
            id: `journal_${Date.now()}`,
            createdAt: new Date().toISOString(),
            userId,
            ...payload,
        });
    }
    const created = await prisma_1.default.event.create({
        data: {
            stream_id: userId,
            type: JOURNAL_EVENT_TYPE,
            payload,
            version: 1,
        },
    });
    return res.status(201).json({
        id: created.id,
        createdAt: created.created_at.toISOString(),
        userId,
        ...payload,
    });
});
exports.listEntries = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([]);
    }
    const events = await prisma_1.default.event.findMany({
        where: {
            stream_id: userId,
            type: JOURNAL_EVENT_TYPE,
        },
        orderBy: { created_at: 'desc' },
        take: 200,
    });
    const entries = events.map((event) => {
        const payload = (event.payload || {});
        return {
            id: event.id,
            createdAt: event.created_at.toISOString(),
            userId,
            ...payload,
        };
    });
    return res.json(entries);
});
exports.getJournalStats = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({ totalEntries: 0, streak: 0, commonWords: [] });
    }
    const events = await prisma_1.default.event.findMany({
        where: {
            stream_id: userId,
            type: JOURNAL_EVENT_TYPE,
        },
        select: {
            created_at: true,
            payload: true,
        },
        orderBy: { created_at: 'desc' },
        take: 500,
    });
    const dates = events.map((event) => event.created_at.toISOString());
    const streak = computeStreak(dates);
    return res.json({
        totalEntries: events.length,
        streak,
        commonWords: [],
    });
});
