import { useEffect, useState } from 'react';
import { idbImages } from '../utils/idbImageStore';

export const useIdbImageUrl = (key?: string | null, fallback?: string) => {
  const [src, setSrc] = useState<string>(fallback || '');

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const run = async () => {
      if (!key) {
        setSrc(fallback || '');
        return;
      }
      try {
        const blob = await idbImages.get(key);
        if (cancelled) return;
        if (!blob) {
          setSrc(fallback || '');
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(fallback || '');
      }
    };

    run();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, fallback]);

  return src;
};

