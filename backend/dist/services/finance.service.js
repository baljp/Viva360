"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeService = exports.FinanceService = void 0;
const finance_repository_1 = require("../repositories/finance.repository");
const supabase_service_1 = require("./supabase.service");
const cache_1 = require("../lib/cache");
class FinanceService {
    async getSummary(userId) {
        if ((0, supabase_service_1.isMockMode)()) {
            return {
                personal_balance: 500,
                corporate_balance: 1500
            };
        }
        const cacheKey = `fin_summary:${userId}`;
        const cached = await (0, cache_1.cacheGet)(cacheKey);
        if (cached)
            return cached;
        const profile = await finance_repository_1.financeRepository.getProfile(userId);
        if (!profile)
            throw new Error('Profile not found'); // Should be 404 handled by caller or global handler
        const data = {
            personal_balance: profile.personal_balance,
            corporate_balance: profile.corporate_balance
        };
        await (0, cache_1.cacheSet)(cacheKey, data, 10);
        return data;
    }
    async getTransactions(userId) {
        if ((0, supabase_service_1.isMockMode)()) {
            return [
                { id: 'tx-1', amount: 100, description: 'Consulta Inicial', date: new Date().toISOString(), type: 'credit' },
                { id: 'tx-2', amount: -50, description: 'Taxa de Plataforma', date: new Date().toISOString(), type: 'debit' }
            ];
        }
        return await finance_repository_1.financeRepository.getTransactions(userId);
    }
}
exports.FinanceService = FinanceService;
exports.financeService = new FinanceService();
