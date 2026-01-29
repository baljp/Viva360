import { financeRepository } from '../repositories/finance.repository';
import { isMockMode } from './supabase.service';
import { cacheGet, cacheSet } from '../lib/cache';

export class FinanceService {
    async getSummary(userId: string) {
        if (isMockMode()) {
            return {
                personal_balance: 500,
                corporate_balance: 1500
            };
        }

        const cacheKey = `fin_summary:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        const profile = await financeRepository.getProfile(userId);
        if (!profile) throw new Error('Profile not found'); // Should be 404 handled by caller or global handler

        const data = {
            personal_balance: profile.personal_balance,
            corporate_balance: profile.corporate_balance
        };
        
        await cacheSet(cacheKey, data, 10);
        return data;
    }

    async getTransactions(userId: string) {
        if (isMockMode()) {
            return [
                { id: 'tx-1', amount: 100, description: 'Consulta Inicial', date: new Date().toISOString(), type: 'credit' },
                { id: 'tx-2', amount: -50, description: 'Taxa de Plataforma', date: new Date().toISOString(), type: 'debit' }
            ];
        }

        return await financeRepository.getTransactions(userId);
    }
}

export const financeService = new FinanceService();
