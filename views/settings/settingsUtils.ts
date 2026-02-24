import type { Transaction } from '../../types';

export const normalizeSettingsTransactions = (transactions: Transaction[]): Transaction[] =>
  transactions.map((tx) => {
    const normalizedType = String(tx.type || '').toLowerCase();
    const isIncome =
      normalizedType === 'income' ||
      normalizedType === 'credit' ||
      normalizedType === 'deposit' ||
      normalizedType === 'entrada';
    return {
      ...tx,
      amount: Number(tx.amount || 0),
      date: tx.date || new Date().toISOString(),
      type: isIncome ? 'income' : 'expense',
    } as Transaction;
  });

export const downloadJsonFile = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
