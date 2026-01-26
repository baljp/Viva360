"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.getSummary = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const cache_1 = require("../lib/cache");
const getSummary = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({
            personal_balance: 500,
            corporate_balance: 1500
        });
    }
    const cacheKey = `fin_summary:${userId}`;
    const cached = await (0, cache_1.cacheGet)(cacheKey);
    if (cached)
        return res.json(cached);
    const profile = await prisma_1.default.profile.findUnique({ where: { id: userId } });
    if (!profile)
        return res.status(404).json({ error: 'Profile not found' });
    const data = {
        personal_balance: profile.personal_balance,
        corporate_balance: profile.corporate_balance
    };
    await (0, cache_1.cacheSet)(cacheKey, data, 10); // Short cache (10s) as balance changes often
    return res.json(data);
};
exports.getSummary = getSummary;
const getTransactions = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'tx-1', amount: 100, description: 'Consulta Inicial', date: new Date().toISOString(), type: 'credit' },
            { id: 'tx-2', amount: -50, description: 'Taxa de Plataforma', date: new Date().toISOString(), type: 'debit' }
        ]);
    }
    const transactions = await prisma_1.default.transaction.findMany({
        where: { user_id: userId },
        orderBy: { date: 'desc' },
        take: 20
    });
    return res.json(transactions);
};
exports.getTransactions = getTransactions;
