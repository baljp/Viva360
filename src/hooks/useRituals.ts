import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

// ==========================================
// RITUALS HOOK
// For: Buscador (Client) Profile
// Daily check-in, plant care, quests
// ==========================================

interface RitualStatus {
  streak: number;
  multiplier: number;
  karma: number;
  plantXp: number;
  plantStage: string;
  lastCheckIn: string | null;
  lastMood: string | null;
  intention: string | null;
  hasCheckedInToday: boolean;
  streakAtRisk: boolean;
  nextReward: number;
  plantStageName: string;
  plantProgress: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface DailyQuest {
  id: string;
  label: string;
  reward: number;
  isCompleted: boolean;
  type: string;
  description: string;
}

interface CheckInResult {
  success: boolean;
  message: string;
  streak: number;
  multiplier: number;
  karmaGained: number;
  plantXpGained: number;
  plantEvolved: boolean;
  user: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export function useRituals() {
  const [status, setStatus] = useState<RitualStatus | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ritual status
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rituals/status`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch ritual status');
      const data = await res.json();
      setStatus(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar status do ritual';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch daily quests
  const fetchQuests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rituals/quests`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch quests');
      const data = await res.json();
      setQuests(data.quests || []);
      return data;
    } catch (err) {
      console.warn('Failed to fetch quests:', err);
      return { quests: [] };
    }
  }, []);

  // Perform daily check-in
  const checkIn = useCallback(async (mood?: string, intention?: string, photoUrl?: string): Promise<CheckInResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rituals/check-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mood, intention, photoUrl }),
      });
      if (!res.ok) throw new Error('Failed to check in');
      const data = await res.json();
      
      // Update local status
      if (data.user) {
        setStatus(prev => prev ? { ...prev, ...data.user, hasCheckedInToday: true } : null);
      }
      
      // Refetch quests after check-in
      await fetchQuests();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer check-in';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchQuests]);

  // Water plant (self or other user)
  const waterPlant = useCallback(async (targetUserId?: string, message?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/rituals/water`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetUserId, message }),
      });
      if (!res.ok) throw new Error('Failed to water plant');
      const data = await res.json();
      
      // Refresh status if self-watering
      if (!targetUserId) {
        await fetchStatus();
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao regar planta';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  // Complete breathing exercise
  const completeBreathing = useCallback(async (duration: number, technique?: string) => {
    try {
      const res = await fetch(`${API_URL}/rituals/breathe`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ duration, technique }),
      });
      if (!res.ok) throw new Error('Failed to complete breathing');
      const data = await res.json();
      await fetchStatus();
      await fetchQuests();
      return data;
    } catch (err) {
      console.error('Breathing exercise error:', err);
      return null;
    }
  }, [fetchStatus, fetchQuests]);

  // Record gratitude
  const recordGratitude = useCallback(async (content: string, photoUrl?: string) => {
    try {
      const res = await fetch(`${API_URL}/rituals/gratitude`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, photoUrl }),
      });
      if (!res.ok) throw new Error('Failed to record gratitude');
      const data = await res.json();
      await fetchStatus();
      await fetchQuests();
      return data;
    } catch (err) {
      console.error('Gratitude error:', err);
      return null;
    }
  }, [fetchStatus, fetchQuests]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchQuests();
  }, [fetchStatus, fetchQuests]);

  return {
    // State
    status,
    quests,
    isLoading,
    error,
    
    // Actions
    checkIn,
    waterPlant,
    completeBreathing,
    recordGratitude,
    refresh: fetchStatus,
    refreshQuests: fetchQuests,
    
    // Computed
    hasCheckedInToday: status?.hasCheckedInToday ?? false,
    streakAtRisk: status?.streakAtRisk ?? false,
    currentStreak: status?.streak ?? 0,
    plantStage: status?.plantStage ?? 'SEED',
  };
}
