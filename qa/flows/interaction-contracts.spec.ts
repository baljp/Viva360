import { test, expect } from '@playwright/test';

// SEC-01: Read mock token from env var, never hardcoded.
const MOCK_TOKEN = process.env.MOCK_AUTH_TOKEN || 'test-token-e2e';
const AUTH_HEADER = { Authorization: `Bearer ${MOCK_TOKEN}` };
const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

test.describe('Interaction Contracts', () => {
  test('checkout contextual retorna confirmação e actionReceipt', async ({ request }) => {
    const productResponse = await request.post('/api/marketplace/products', {
      headers: AUTH_HEADER,
      data: {
        name: 'Ritual QA Checkout',
        price: 120,
        category: 'Healing',
        type: 'service',
      },
    });
    expect(productResponse.ok()).toBeTruthy();
    const product = await productResponse.json();

    const checkoutResponse = await request.post('/api/checkout/contextual', {
      headers: AUTH_HEADER,
      data: {
        amount: 120,
        description: 'Checkout contextual QA',
        receiverId: TEST_USER_ID,
        contextType: 'BAZAR',
        contextRef: String(product.id),
        items: [{ id: String(product.id), price: 120, type: 'service' }],
      },
    });

    expect(checkoutResponse.ok()).toBeTruthy();
    const payload = await checkoutResponse.json();
    expect(payload.code).toBe('CHECKOUT_CONFIRMED');
    expect(String(payload.confirmationId || '').length).toBeGreaterThan(0);
    expect(Array.isArray(payload.counterpartiesNotified)).toBeTruthy();
    expect(payload.actionReceipt?.status).toBe('COMPLETED');
  });

  test('escambo lifecycle percorre create/counter/accept/complete', async ({ request }) => {
    const createResponse = await request.post('/api/alchemy/offers', {
      headers: AUTH_HEADER,
      data: {
        requesterId: TEST_USER_ID,
        description: 'Troca de energia QA',
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const offerId = String(created.id || created.offer?.id || '');
    expect(offerId.length).toBeGreaterThan(0);

    const counterResponse = await request.post(`/api/alchemy/offers/${offerId}/counter`, {
      headers: AUTH_HEADER,
      data: { counterOffer: 'Contraproposta QA com ajuste simbólico.' },
    });
    expect(counterResponse.ok()).toBeTruthy();
    expect((await counterResponse.json()).code).toBe('ESCAMBO_COUNTERED');

    const acceptResponse = await request.post(`/api/alchemy/offers/${offerId}/accept`, { headers: AUTH_HEADER });
    expect(acceptResponse.ok()).toBeTruthy();
    expect((await acceptResponse.json()).code).toBe('ESCAMBO_ACCEPTED');

    const completeResponse = await request.post(`/api/alchemy/offers/${offerId}/complete`, { headers: AUTH_HEADER });
    expect(completeResponse.ok()).toBeTruthy();
    const completed = await completeResponse.json();
    expect(completed.code).toBe('ESCAMBO_COMPLETED');
    expect(completed.actionReceipt?.status).toBe('COMPLETED');
  });

  test('recrutamento percorre candidatura -> entrevista -> decisão', async ({ request }) => {
    const applyResponse = await request.post('/api/recruitment/applications', {
      headers: AUTH_HEADER,
      data: {
        vacancyId: 'mock-vacancy-contract',
        notes: 'Aplicação de contrato QA.',
      },
    });
    expect(applyResponse.ok()).toBeTruthy();
    const applicationPayload = await applyResponse.json();
    expect(applicationPayload.code).toBe('APPLICATION_CREATED');
    const applicationId = String(applicationPayload.application?.id || '');
    expect(applicationId.length).toBeGreaterThan(0);

    const interviewAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const interviewResponse = await request.post(`/api/recruitment/applications/${applicationId}/interview`, {
      headers: AUTH_HEADER,
      data: {
        scheduledFor: interviewAt,
        guardianId: TEST_USER_ID,
      },
    });
    expect(interviewResponse.ok()).toBeTruthy();
    const interviewPayload = await interviewResponse.json();
    expect(interviewPayload.code).toBe('INTERVIEW_INVITED');
    const interviewId = String(interviewPayload.interview?.id || '');
    expect(interviewId.length).toBeGreaterThan(0);

    const responseResponse = await request.post(`/api/recruitment/interviews/${interviewId}/respond`, {
      headers: AUTH_HEADER,
      data: {
        decision: 'ACCEPT',
        note: 'Confirmado no fluxo QA.',
      },
    });
    expect(responseResponse.ok()).toBeTruthy();
    expect((await responseResponse.json()).code).toBe('INTERVIEW_ACCEPTED');

    const decisionResponse = await request.post(`/api/recruitment/applications/${applicationId}/decision`, {
      headers: AUTH_HEADER,
      data: {
        decision: 'HIRED',
        note: 'Aprovado no fluxo QA.',
      },
    });
    expect(decisionResponse.ok()).toBeTruthy();
    const decided = await decisionResponse.json();
    expect(decided.code).toBe('APPLICATION_HIRED');
    expect(decided.actionReceipt?.status).toBe('COMPLETED');
  });
});
