import { useEffect, useRef, useState } from 'react';
import { isMockMode, supabase } from '../../lib/supabase';

type Params = {
  roomId?: string | null;
  watchAllRooms?: boolean;
  enabled?: boolean;
  load: () => Promise<void>;
  fallbackPollMs?: number;
  healthyPollMs?: number;
  hiddenFallbackPollMs?: number;
  hiddenHealthyPollMs?: number;
};

export function useChatRoomRealtime({
  roomId,
  watchAllRooms = false,
  enabled = true,
  load,
  fallbackPollMs = 4000,
  healthyPollMs = 15000,
  hiddenFallbackPollMs = 12000,
  hiddenHealthyPollMs = 30000,
}: Params) {
  type SupabaseRealtimeChannel = ReturnType<typeof supabase.channel>;
  const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'subscribed' | 'fallback'>('idle');
  const statusRef = useRef<'idle' | 'subscribed' | 'fallback'>('idle');
  const lastLoadAtRef = useRef(0);
  const loadingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = realtimeStatus;
  }, [realtimeStatus]);

  useEffect(() => {
    if (!enabled || (!roomId && !watchAllRooms)) {
      setRealtimeStatus('idle');
      return;
    }

    let active = true;
    let channel: SupabaseRealtimeChannel | null = null;
    let tickTimer: number | null = null;

    const runLoad = async () => {
      if (!active || loadingRef.current) return;
      loadingRef.current = true;
      try {
        await load();
        lastLoadAtRef.current = Date.now();
      } finally {
        loadingRef.current = false;
      }
    };

    const requestLoad = () => {
      if (!active) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          runLoad().catch(() => undefined);
        });
      });
    };

    runLoad().catch(() => undefined);

    if (!isMockMode) {
      try {
        channel = supabase
          .channel(watchAllRooms ? 'chat-room:all' : `chat-room:${roomId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            ...(watchAllRooms ? {} : { filter: `chat_id=eq.${roomId}` }),
          }, requestLoad)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            ...(watchAllRooms ? {} : { filter: `chat_id=eq.${roomId}` }),
          }, requestLoad)
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages',
            ...(watchAllRooms ? {} : { filter: `chat_id=eq.${roomId}` }),
          }, requestLoad)
          .subscribe((status: string) => {
            if (!active) return;
            if (status === 'SUBSCRIBED') {
              setRealtimeStatus('subscribed');
              statusRef.current = 'subscribed';
              return;
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setRealtimeStatus('fallback');
              statusRef.current = 'fallback';
            }
          });
      } catch {
        setRealtimeStatus('fallback');
        statusRef.current = 'fallback';
      }
    } else {
      setRealtimeStatus('fallback');
      statusRef.current = 'fallback';
    }

    tickTimer = window.setInterval(() => {
      if (!active) return;
      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      const subscribed = statusRef.current === 'subscribed';
      const minGap = subscribed
        ? (hidden ? hiddenHealthyPollMs : healthyPollMs)
        : (hidden ? hiddenFallbackPollMs : fallbackPollMs);
      if (Date.now() - lastLoadAtRef.current < minGap) return;
      runLoad().catch(() => undefined);
    }, 2000);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (tickTimer) window.clearInterval(tickTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [
    roomId,
    watchAllRooms,
    enabled,
    load,
    fallbackPollMs,
    healthyPollMs,
    hiddenFallbackPollMs,
    hiddenHealthyPollMs,
  ]);

  return {
    realtimeStatus,
    usingFallbackPolling: realtimeStatus === 'fallback',
    isRealtimeSubscribed: realtimeStatus === 'subscribed',
  };
}
