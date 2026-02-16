const decodeBase64 = (payload: string) => {
  if (typeof atob === 'function') return atob(payload);
  if (typeof Buffer !== 'undefined') return Buffer.from(payload, 'base64').toString('binary');
  throw new Error('Base64 decoding is unavailable in this runtime.');
};

export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, payload] = dataUrl.split(',');
  if (!meta || !payload) {
    throw new Error('Invalid data URL payload.');
  }

  const mimeMatch = /data:([^;]+);base64/.exec(meta);
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = decodeBase64(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
};
