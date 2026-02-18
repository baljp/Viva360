import { useEffect, useState } from 'react';

export const useObjectUrl = (blob?: Blob | null) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
};

