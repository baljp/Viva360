"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInterventions = exports.saveIntervention = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const async_middleware_1 = require("../middleware/async.middleware");
const supabase_service_1 = require("../services/supabase.service");
const INTERVENTION_EVENT_TYPE = 'CLINICAL_INTERVENTION';
exports.saveIntervention = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const payload = req.body || {};
    if ((0, supabase_service_1.isMockMode)()) {
        return res.status(201).json({
            id: `intervention_${Date.now()}`,
            createdAt: new Date().toISOString(),
            userId,
            ...payload,
        });
    }
    const created = await prisma_1.default.event.create({
        data: {
            stream_id: userId,
            type: INTERVENTION_EVENT_TYPE,
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
exports.listInterventions = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([]);
    }
    const events = await prisma_1.default.event.findMany({
        where: {
            stream_id: userId,
            type: INTERVENTION_EVENT_TYPE,
        },
        orderBy: { created_at: 'desc' },
        take: 200,
    });
    const data = events.map((event) => ({
        id: event.id,
        createdAt: event.created_at.toISOString(),
        userId,
        ...event.payload,
    }));
    return res.json(data);
});
