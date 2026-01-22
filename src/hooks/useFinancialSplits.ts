import { useState, useCallback, useEffect } from 'react';

// ==========================================
// FINANCIAL SPLITS HOOK
// For: Guardião (Professional) & Santuário (Space) Profiles
// Revenue sharing, team performance, withdrawals
// ==========================================

interface FinanceSummary {
  grossRevenue: number;
  netRevenue: number;
  platformFee: number;
  spaceSplit?: number;
  professionalEarnings?: number;
  pendingPayments: number;
  period: string;
}

interface SplitDetail {
  appointmentId: string;
  serviceName: string;
  clientName: string;
  professionalName: string;
  grossAmount: number;
  platformFee: number;
  professionalEarning: number;
  spaceEarning: number;
  date: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  reference?: string;
  paymentMethod?: string;
}

interface TeamMemberPerformance {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  rating: number;
  specialty: string[];
  commissionRate: number;
  sessionsThisPeriod: number;
  revenueThisPeriod: number;
  avgSessionValue: number;
  totalSessions: number;
  totalRevenue: number;
}

interface ChartData {
  date: string;
  revenue: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export function useFinancialSplits() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamMemberPerformance[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch finance summary
  const fetchSummary = useCallback(async (period: number = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/finance/summary?period=${period}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch finance summary');
      const data = await res.json();
      setSummary(data.summary);
      setSplitDetails(data.splitDetails || []);
      setChartData(data.chartData || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar resumo financeiro';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch transaction history
  const fetchTransactions = useCallback(async (page: number = 1, type?: 'INCOME' | 'EXPENSE') => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (type) params.append('type', type);
      
      const res = await fetch(`${API_URL}/finance/transactions?${params}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data.data || []);
      return data;
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      return { data: [], pagination: {} };
    }
  }, []);

  // Fetch team performance (Space owners only)
  const fetchTeamPerformance = useCallback(async (period: number = 30) => {
    try {
      const res = await fetch(`${API_URL}/finance/team-performance?period=${period}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch team performance');
      const data = await res.json();
      setTeamPerformance(data.team || []);
      return data;
    } catch (err) {
      console.error('Failed to fetch team performance:', err);
      return { team: [] };
    }
  }, []);

  // Update commission rate for team member (Space owners only)
  const updateCommissionRate = useCallback(async (memberId: string, commissionRate: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/finance/commission/${memberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ commissionRate }),
      });
      if (!res.ok) throw new Error('Failed to update commission rate');
      const data = await res.json();
      
      // Update local state
      setTeamPerformance(prev => 
        prev.map(member => 
          member.id === memberId ? { ...member, commissionRate } : member
        )
      );
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar comissão';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request withdrawal
  const requestWithdrawal = useCallback(async (amount: number, pixKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/finance/withdraw`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, pixKey }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to request withdrawal');
      }
      const data = await res.json();
      
      // Refresh summary after withdrawal
      await fetchSummary();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar saque';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSummary]);

  // Process appointment split
  const processAppointmentSplit = useCallback(async (appointmentId: string) => {
    try {
      const res = await fetch(`${API_URL}/finance/process-split/${appointmentId}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to process split');
      const data = await res.json();
      
      // Refresh data
      await fetchSummary();
      await fetchTransactions();
      
      return data;
    } catch (err) {
      console.error('Failed to process split:', err);
      return null;
    }
  }, [fetchSummary, fetchTransactions]);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, [fetchSummary, fetchTransactions]);

  return {
    // State
    summary,
    splitDetails,
    transactions,
    teamPerformance,
    chartData,
    isLoading,
    error,
    
    // Actions
    fetchSummary,
    fetchTransactions,
    fetchTeamPerformance,
    updateCommissionRate,
    requestWithdrawal,
    processAppointmentSplit,
    
    // Computed
    totalRevenue: summary?.grossRevenue ?? 0,
    netRevenue: summary?.netRevenue ?? 0,
    pendingPayments: summary?.pendingPayments ?? 0,
  };
}
