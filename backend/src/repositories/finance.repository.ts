import prisma from '../lib/prisma'; // Using Prisma for Finance still

export interface TransactionCreateData {
    user_id: string;
    amount: number;
    description: string;
    type: 'credit' | 'debit';
}

export class FinanceRepository {
    async getProfile(userId: string) {
        return await prisma.profile.findUnique({ where: { id: userId } });
    }

    async getTransactions(userId: string, limit = 20) {
        return await prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: { date: 'desc' },
            take: limit
        });
    }

    // Placeholder if we needed Create, but controller was read-only mostly
}

export const financeRepository = new FinanceRepository();
