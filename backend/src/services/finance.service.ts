import { financeRepository } from '../repositories/finance.repository';
import { cacheGet, cacheSet } from '../lib/cache';

export class FinanceService {
    async getSummary(userId: string) {
        const cacheKey = `fin_summary:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        const profile = await financeRepository.getProfile(userId);
        if (!profile) throw new Error('Profile not found');

        const data = {
            personal_balance: profile.personal_balance,
            corporate_balance: profile.corporate_balance
        };
        
        await cacheSet(cacheKey, data, 10);
        return data;
    }

    async getTransactions(userId: string) {
        return await financeRepository.getTransactions(userId);
    }
}

export const financeService = new FinanceService();
