import { describe, expect, it } from 'vitest';
import { detectMaliciousPayload } from '../middleware/security.middleware';

describe('WAF payload detection', () => {
  it('flags script injection', () => {
    const blockedBy = detectMaliciousPayload('<script>alert("x")</script>');
    expect(blockedBy).toBe('xss_script');
  });

  it('flags SQL injection pattern', () => {
    const blockedBy = detectMaliciousPayload("email=a@a.com' OR 1=1 --");
    expect(blockedBy).toBeTruthy();
  });

  it('does not block regular form payloads', () => {
    const blockedBy = detectMaliciousPayload('nome=Joao #1 email=joao@example.com observacao=Tudo certo');
    expect(blockedBy).toBeNull();
  });
});

