import { describe, expect, it } from 'vitest';
import { dataUrlToBlob } from './dataUrl';

describe('dataUrlToBlob', () => {
  it('converte data URL base64 para blob com mime correto', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,SGVsbG8=');
    expect(blob.type).toBe('text/plain');
    await expect(blob.text()).resolves.toBe('Hello');
  });

  it('falha para data URL inválida', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow('Invalid data URL payload.');
  });
});
