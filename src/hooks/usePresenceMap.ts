import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

type PresenceStatus = 'ONLINE' | 'OFFLINE';

export function usePresenceMap(guardianIds: string[], opts?: { pollMs?: number; maxBatch?: number }) {
  const pollMs = opts?.pollMs ?? 30000;
  const maxBatch = opts?.maxBatch ?? 60;

  const ids = useMemo(() => {
    const uniq = Array.from(new Set((guardianIds || []).filter(Boolean)));
    // Keep calls bounded in lists; UI will still show UNKNOWN for overflow.
    return uniq.slice(0, Math.max(0, maxBatch));
  }, [guardianIds, maxBatch]);

  const [statusById, setStatusById] = useState<Record<string, PresenceStatus>>({});

  useEffect(() => {
    let cancelled = false;
    if (!ids.length) {
      setStatusById({});
      return;
    }

    const load = async () => {
      try {
        const result = (await api.presence.getBatch(ids)) as Record<string, PresenceStatus>;
        if (!cancelled && result && typeof result === 'object') setStatusById(result);
      } catch {
        if (!cancelled) setStatusById({});
      }
    };

    load();
    const t = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [ids.join('|'), pollMs]);

  return statusById;
}

