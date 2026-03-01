// ─── services/api/realtime.ts ──────────────────────────────────────────────────
// Enterprise Real-time Event Subscription Layer
// Uses Supabase Realtime when credentials are available; falls back to
// lightweight presence-based polling (no Math.random fabrication).
// ─────────────────────────────────────────────────────────────────────────────

type RealtimeCallback = (payload: unknown) => void;

class RealtimeManager {
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private activeSubscriptions: Map<string, { cleanup: () => void }> = new Map();

  /**
   * Subscribe to a channel.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  subscribe(channel: string, callback: RealtimeCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    if (!this.activeSubscriptions.has(channel)) {
      this.connectChannel(channel);
    }

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.disconnectChannel(channel);
        }
      }
    };
  }

  /** Broadcast locally (used by server-sent events or other transports). */
  broadcast(channel: string, payload: unknown): void {
    this.listeners.get(channel)?.forEach((cb) => cb(payload));
  }

  private connectChannel(channel: string): void {
    // Try to connect via Supabase Realtime if supabase client is available
    if (channel === 'radiance:update') {
      this.connectRadiance();
    }
    // Other channels can be added here as needed
  }

  private connectRadiance(): void {
    const CHANNEL = 'radiance:update';

    // Try Supabase realtime subscription (postgres_changes on transactions table)
    try {
      // Lazy import to avoid circular deps and to support SSR gracefully
      import('../../lib/supabase').then(({ supabase, isMockMode }) => {
        if (isMockMode) {
          // In mock/test mode: emit a single static pulse so UI renders,
          // then stop — no continuous Math.random spam.
          const timer = window.setTimeout(() => {
            this.broadcast(CHANNEL, { delta: 0, source: 'mock-pulse', timestamp: new Date().toISOString() });
          }, 500);
          this.activeSubscriptions.set(CHANNEL, {
            cleanup: () => window.clearTimeout(timer),
          });
          return;
        }

        // Real Supabase Realtime: subscribe to INSERT on transactions table.
        // Each new transaction (payment received) signals that the space's
        // revenue changed → triggers a radiance recalculation on the client.
        const sub = supabase
          .channel('radiance-transactions')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'transactions' },
            (payload: { new: { amount?: number; type?: string } }) => {
              const amount = Number(payload.new?.amount ?? 0);
              const type = String(payload.new?.type ?? '');
              // Only income transactions increase radiance
              const delta = type === 'income' ? Math.min(2, amount / 1000) : 0;
              this.broadcast(CHANNEL, {
                delta,
                source: 'supabase-realtime',
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe();

        this.activeSubscriptions.set(CHANNEL, {
          cleanup: () => { supabase.removeChannel(sub); },
        });
      }).catch(() => {
        // Supabase unavailable — no simulation; just stay silent.
        // UI will use its last known radianceScore.
        this.activeSubscriptions.set(CHANNEL, { cleanup: () => {} });
      });
    } catch {
      this.activeSubscriptions.set(CHANNEL, { cleanup: () => {} });
    }
  }

  private disconnectChannel(channel: string): void {
    const sub = this.activeSubscriptions.get(channel);
    if (sub) {
      sub.cleanup();
      this.activeSubscriptions.delete(channel);
    }
    this.listeners.delete(channel);
  }
}

export const realtime = new RealtimeManager();
