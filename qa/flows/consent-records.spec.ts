import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

type UserRole = 'CLIENT' | 'PROFESSIONAL';

const TEST_JWT_SECRET = 'viva360_test_jwt_secret_2026';
const patientId = '22222222-2222-4222-8222-222222222222';
const professionalId = '33333333-3333-4333-8333-333333333333';

const makeToken = (input: { userId: string; role: UserRole; email: string }) =>
  jwt.sign(
    {
      sub: input.userId,
      id: input.userId,
      userId: input.userId,
      email: input.email,
      role: input.role,
      activeRole: input.role,
      roles: [input.role],
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe('Consentimento de prontuario (E2E API)', () => {
  test('grant -> acesso ok -> revoke -> bloqueio', async ({ request }) => {
    const clientToken = makeToken({
      userId: patientId,
      role: 'CLIENT',
      email: 'buscador.consent.qa@viva360.test',
    });
    const professionalToken = makeToken({
      userId: professionalId,
      role: 'PROFESSIONAL',
      email: 'guardiao.consent.qa@viva360.test',
    });

    const beforeGrantCreate = await request.post('/api/records', {
      headers: authHeaders(professionalToken),
      data: {
        patientId,
        content: 'Nota clinica sem consentimento previo',
        type: 'session',
      },
    });
    expect(beforeGrantCreate.status()).toBe(403);
    const beforeGrantPayload = await beforeGrantCreate.json();
    expect(String(beforeGrantPayload.error || '')).toContain('CONSENT_REQUIRED');

    const grantResponse = await request.post('/api/records/grant', {
      headers: authHeaders(clientToken),
      data: { professionalId },
    });
    expect(grantResponse.ok()).toBeTruthy();
    const grantPayload = await grantResponse.json();
    expect(grantPayload?.consent?.status).toBe('ACTIVE');

    const createWithConsent = await request.post('/api/records', {
      headers: authHeaders(professionalToken),
      data: {
        patientId,
        content: 'Nota clinica apos consentimento ativo',
        type: 'session',
      },
    });
    expect(createWithConsent.status()).toBe(201);

    const listWithConsent = await request.get(`/api/records?patientId=${patientId}`, {
      headers: authHeaders(professionalToken),
    });
    expect(listWithConsent.status()).toBe(200);

    const revokeResponse = await request.post('/api/records/revoke', {
      headers: authHeaders(clientToken),
      data: { professionalId },
    });
    expect(revokeResponse.ok()).toBeTruthy();
    const revokePayload = await revokeResponse.json();
    expect(revokePayload?.consent?.status).toBe('REVOKED');

    const createAfterRevoke = await request.post('/api/records', {
      headers: authHeaders(professionalToken),
      data: {
        patientId,
        content: 'Tentativa apos revogacao',
        type: 'session',
      },
    });
    expect(createAfterRevoke.status()).toBe(403);
    const blockedCreatePayload = await createAfterRevoke.json();
    expect(String(blockedCreatePayload.error || '')).toContain('CONSENT_REQUIRED');

    const listAfterRevoke = await request.get(`/api/records?patientId=${patientId}`, {
      headers: authHeaders(professionalToken),
    });
    expect(listAfterRevoke.status()).toBe(403);
    const blockedListPayload = await listAfterRevoke.json();
    expect(String(blockedListPayload.error || '')).toContain('CONSENT_REQUIRED');
  });
});
