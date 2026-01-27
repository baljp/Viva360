
import { Transaction } from '../../types';

export const PAYMENT_MOCK_DATA = {
    transactions: [
        {
            id: 'tx_001',
            userId: 'user_001',
            type: 'expense',
            amount: 150.00,
            currency: 'BRL',
            description: 'Sessão de Reiki',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            paymentMethod: 'credit_card',
            providerId: 'pro_001'
        },
        {
            id: 'tx_002',
            userId: 'pro_001',
            type: 'income',
            amount: 127.50, // 85% of 150
            currency: 'BRL',
            description: 'Pagamento recebido: Sessão de Reiki',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            split: { platform: 22.50, provider: 127.50 }
        }
    ] as Transaction[]
};

export const PaymentServiceMock = {
    // Process a checkout
    processPayment: async (amount: number, description: string, userId: string, providerId?: string): Promise<Transaction> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const tx: Transaction = {
                    id: `tx_${Date.now()}`,
                    userId,
                    providerId,
                    type: 'expense',
                    amount,
                    currency: 'BRL',
                    description,
                    date: new Date().toISOString(),
                    status: 'completed',
                    paymentMethod: 'credit_card'
                };
                
                // Add to mock DB
                PAYMENT_MOCK_DATA.transactions.unshift(tx);

                // If provider involved, create income tx
                if (providerId) {
                    const splitPlatform = amount * 0.15;
                    const splitProvider = amount * 0.85;
                    PAYMENT_MOCK_DATA.transactions.unshift({
                        id: `tx_inc_${Date.now()}`,
                        userId: providerId,
                        type: 'income',
                        amount: splitProvider,
                        currency: 'BRL',
                        description: `Pagamento recebido: ${description}`,
                        date: new Date().toISOString(),
                        status: 'completed',
                        split: { platform: splitPlatform, provider: splitProvider }
                    });
                }

                resolve(tx);
            }, 1000); // Simulate network delay
        });
    },

    getHistory: async (userId: string): Promise<Transaction[]> => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(PAYMENT_MOCK_DATA.transactions.filter(t => t.userId === userId));
            }, 500);
        });
    },

    getBalance: async (userId: string): Promise<{ personal: number, corporate: number }> => {
        // Calculate dynamic balance from history
        const txs = PAYMENT_MOCK_DATA.transactions.filter(t => t.userId === userId && t.status === 'completed');
        const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return {
            personal: income - expense + 100, // +100 initial bonus
            corporate: 0
        };
    }
};
