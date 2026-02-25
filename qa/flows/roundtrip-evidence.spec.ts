import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

type UserRole = 'CLIENT' | 'PROFESSIONAL' | 'SPACE' | 'ADMIN';

const TEST_JWT_SECRET = 'viva360_test_jwt_secret_2026';
const ids = {
  client: '22222222-2222-4222-8222-222222222222',
  professional: '33333333-3333-4333-8333-333333333333',
  space: '44444444-4444-4444-8444-444444444444',
  admin: '11111111-1111-4111-8111-111111111111',
  otherClient: '55555555-5555-4555-8555-555555555555',
};

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

const TOKENS = {
  client: makeToken({ userId: ids.client, role: 'CLIENT', email: 'buscador.qa@viva360.test' }),
  professional: makeToken({ userId: ids.professional, role: 'PROFESSIONAL', email: 'guardiao.qa@viva360.test' }),
  space: makeToken({ userId: ids.space, role: 'SPACE', email: 'santuario.qa@viva360.test' }),
  admin: makeToken({ userId: ids.admin, role: 'ADMIN', email: 'admin.qa@viva360.test' }),
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const mark = (flowId: string) => `${flowId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const tomorrowIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const uniqueVacancy = (flowId: string) => `mock-vacancy-${mark(flowId)}`;

test.describe('Roundtrip evidence (API-only)', () => {
  test('buscador_ritual_diario', async ({ request }) => {
    const tag = mark('ritual');
    const create = await request.post('/api/journal', {
      headers: auth(TOKENS.client),
      data: { title: 'Ritual diario', body: `roundtrip ${tag}`, ritualType: 'daily' },
    });
    expect(create.status()).toBe(201);

    const list = await request.get('/api/journal', { headers: auth(TOKENS.client) });
    expect(list.ok()).toBeTruthy();
    const entries = await list.json();
    expect(Array.isArray(entries)).toBeTruthy();
    expect(entries.some((e: { body?: string }) => String(e.body || '').includes(tag))).toBeTruthy();
  });

  test('buscador_metamorfose_karma_timelapse', async ({ request }) => {
    const tag = mark('timelapse');
    const create = await request.post('/api/journal', {
      headers: auth(TOKENS.client),
      data: { body: `timelapse checkpoint ${tag}`, mood: 'grato', karmaDelta: 8 },
    });
    expect(create.status()).toBe(201);

    const stats = await request.get('/api/journal/stats', { headers: auth(TOKENS.client) });
    expect(stats.ok()).toBeTruthy();
    const payload = await stats.json();
    expect(Number(payload.totalEntries || 0)).toBeGreaterThan(0);
  });

  test('buscador_busca_agenda_confirmacao', async ({ request }) => {
    const apply = await request.post('/api/recruitment/applications', {
      headers: auth(TOKENS.client),
      data: { vacancyId: uniqueVacancy('busca_agenda_confirmacao'), notes: 'roundtrip agenda confirmacao' },
    });
    expect(apply.status()).toBe(201);
    const appPayload = await apply.json();
    const appId = String(appPayload.application?.id || '');
    expect(appId.length).toBeGreaterThan(0);

    const list = await request.get('/api/recruitment/applications?scope=candidate', {
      headers: auth(TOKENS.client),
    });
    expect(list.ok()).toBeTruthy();
    const applications = await list.json();
    expect(Array.isArray(applications)).toBeTruthy();
    expect(applications.some((a: { id?: string }) => String(a.id || '') === appId)).toBeTruthy();
  });

  test('buscador_retiro_offline', async ({ request }) => {
    const tag = mark('retiro');
    const spaceId = `space-${tag}`;
    const create = await request.post('/api/reviews', {
      headers: auth(TOKENS.client),
      data: {
        spaceId,
        targetType: 'space',
        targetName: 'Retiro QA',
        authorName: 'Buscador QA',
        rating: 9,
        comment: `retiro offline ${tag}`,
      },
    });
    expect(create.status()).toBe(201);

    const list = await request.get(`/api/reviews/${spaceId}?type=space`, { headers: auth(TOKENS.client) });
    expect(list.ok()).toBeTruthy();
    const payload = await list.json();
    expect(Array.isArray(payload.reviews)).toBeTruthy();
    expect(payload.reviews.some((r: { comment?: string }) => String(r.comment || '').includes(tag))).toBeTruthy();
  });

  test('buscador_pacto_de_alma', async ({ request }) => {
    const tag = mark('pacto');
    const create = await request.post('/api/alchemy/offers', {
      headers: auth(TOKENS.client),
      data: { requesterId: ids.otherClient, description: `Pacto da alma ${tag}` },
    });
    expect(create.status()).toBe(201);
    const created = await create.json();
    const offerId = String(created.id || created.offer?.id || '');
    expect(offerId.length).toBeGreaterThan(0);

    const list = await request.get('/api/alchemy/offers', { headers: auth(TOKENS.client) });
    expect(list.ok()).toBeTruthy();
    const offers = await list.json();
    expect(Array.isArray(offers)).toBeTruthy();
    expect(offers.some((o: { id?: string }) => String(o.id || '') === offerId)).toBeTruthy();
  });

  test('buscador_jornada_analitica_e_journal', async ({ request }) => {
    const tag = mark('journal');
    const create = await request.post('/api/journal', {
      headers: auth(TOKENS.client),
      data: { body: `jornada analitica ${tag}`, insight: 'auto-observacao' },
    });
    expect(create.status()).toBe(201);

    const list = await request.get('/api/journal', { headers: auth(TOKENS.client) });
    expect(list.ok()).toBeTruthy();
    const entries = await list.json();
    expect(entries.some((e: { body?: string }) => String(e.body || '').includes(tag))).toBeTruthy();
  });

  test('buscador_metamorfose_ritual_retorno', async ({ request }) => {
    const tag = mark('retorno');
    const create = await request.post('/api/journal', {
      headers: auth(TOKENS.client),
      data: { body: `ritual retorno ${tag}`, phase: 'retorno' },
    });
    expect(create.status()).toBe(201);

    const list = await request.get('/api/journal', { headers: auth(TOKENS.client) });
    expect(list.ok()).toBeTruthy();
    const entries = await list.json();
    expect(entries.some((e: { body?: string }) => String(e.body || '').includes(tag))).toBeTruthy();
  });

  test('guardiao_intervencao_clinica', async ({ request }) => {
    const tag = mark('clinica');
    const create = await request.post('/api/clinical/interventions', {
      headers: auth(TOKENS.professional),
      data: { patientId: ids.client, summary: `Intervencao ${tag}`, type: 'breathwork' },
    });
    expect(create.status()).toBe(201);
    const created = await create.json();
    const interventionId = String(created.id || '');

    const list = await request.get('/api/clinical/interventions', {
      headers: auth(TOKENS.professional),
    });
    expect(list.ok()).toBeTruthy();
    const interventions = await list.json();
    expect(interventions.some((e: { id?: string }) => String(e.id || '') === interventionId)).toBeTruthy();
  });

  test('guardiao_agenda_video', async ({ request }) => {
    const apply = await request.post('/api/recruitment/applications', {
      headers: auth(TOKENS.client),
      data: { vacancyId: uniqueVacancy('guardiao_agenda_video'), notes: 'video agenda' },
    });
    expect(apply.status()).toBe(201);
    const appId = String((await apply.json()).application?.id || '');

    const schedule = await request.post(`/api/recruitment/applications/${appId}/interview`, {
      headers: auth(TOKENS.space),
      data: { scheduledFor: tomorrowIso(), guardianId: ids.professional },
    });
    expect(schedule.ok()).toBeTruthy();
    const interviewId = String((await schedule.json()).interview?.id || '');
    expect(interviewId.length).toBeGreaterThan(0);

    const respond = await request.post(`/api/recruitment/interviews/${interviewId}/respond`, {
      headers: auth(TOKENS.professional),
      data: { decision: 'ACCEPT', note: 'Video call confirmada' },
    });
    expect(respond.ok()).toBeTruthy();

    const list = await request.get('/api/recruitment/applications?scope=candidate', {
      headers: auth(TOKENS.professional),
    });
    expect(list.ok()).toBeTruthy();
    const apps = await list.json();
    const app = apps.find((a: { id?: string }) => String(a.id || '') === appId);
    expect(app).toBeTruthy();
    expect(String(app.status || '')).toContain('INTERVIEW_ACCEPTED');
  });

  test('guardiao_financeiro_expandido', async ({ request }) => {
    const tag = mark('guardiao-financeiro');
    const create = await request.post('/api/marketplace/products', {
      headers: auth(TOKENS.professional),
      data: { name: `Sessao ${tag}`, price: 180, category: 'Healing', type: 'service' },
    });
    expect(create.status()).toBe(201);
    const productId = String((await create.json()).id || '');

    const list = await request.get(`/api/marketplace/products?ownerId=${ids.professional}`, {
      headers: auth(TOKENS.professional),
    });
    expect(list.ok()).toBeTruthy();
    const products = await list.json();
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.some((p: { id?: string }) => String(p.id || '') === productId)).toBeTruthy();
  });

  test('guardiao_santuarios_parceria', async ({ request }) => {
    const tag = mark('parceria');
    const spaceId = `space-${tag}`;
    const create = await request.post('/api/reviews', {
      headers: auth(TOKENS.professional),
      data: {
        spaceId,
        targetId: ids.professional,
        targetType: 'guardian',
        targetName: 'Guardiao Parceiro',
        authorName: 'Santuario QA',
        rating: 8,
        comment: `parceria ${tag}`,
      },
    });
    expect(create.status()).toBe(201);

    const summary = await request.get(`/api/reviews/${spaceId}/summary`, {
      headers: auth(TOKENS.professional),
    });
    expect(summary.ok()).toBeTruthy();
    const payload = await summary.json();
    expect(Number(payload.totalReviews || 0)).toBeGreaterThan(0);
  });

  test('santuario_operacao_completa', async ({ request }) => {
    const apply = await request.post('/api/recruitment/applications', {
      headers: auth(TOKENS.client),
      data: { vacancyId: uniqueVacancy('santuario_operacao_completa'), notes: 'operacao completa' },
    });
    expect(apply.status()).toBe(201);
    const applicationId = String((await apply.json()).application?.id || '');

    const schedule = await request.post(`/api/recruitment/applications/${applicationId}/interview`, {
      headers: auth(TOKENS.space),
      data: { scheduledFor: tomorrowIso(), guardianId: ids.professional },
    });
    expect(schedule.ok()).toBeTruthy();
    const interviewId = String((await schedule.json()).interview?.id || '');

    const respond = await request.post(`/api/recruitment/interviews/${interviewId}/respond`, {
      headers: auth(TOKENS.professional),
      data: { decision: 'ACCEPT', note: 'Aceito' },
    });
    expect(respond.ok()).toBeTruthy();

    const decide = await request.post(`/api/recruitment/applications/${applicationId}/decision`, {
      headers: auth(TOKENS.space),
      data: { decision: 'HIRED', note: 'Contratado no roundtrip' },
    });
    expect(decide.ok()).toBeTruthy();

    const list = await request.get('/api/recruitment/applications', { headers: auth(TOKENS.space) });
    expect(list.ok()).toBeTruthy();
    const apps = await list.json();
    const app = apps.find((a: { id?: string }) => String(a.id || '') === applicationId);
    expect(app).toBeTruthy();
    expect(String(app.status || '')).toBe('HIRED');
  });

  test('santuario_salaseestrutura_expandida', async ({ request }) => {
    const tag = mark('salas');
    const create = await request.post('/api/marketplace/products', {
      headers: auth(TOKENS.space),
      data: { name: `Sala ${tag}`, price: 300, category: 'Infrastructure', type: 'space' },
    });
    expect(create.status()).toBe(201);
    const productId = String((await create.json()).id || '');

    const list = await request.get(`/api/marketplace/products?ownerId=${ids.space}`, {
      headers: auth(TOKENS.space),
    });
    expect(list.ok()).toBeTruthy();
    const products = await list.json();
    expect(products.some((p: { id?: string }) => String(p.id || '') === productId)).toBeTruthy();
  });

  test('santuario_financeiro_expandido', async ({ request }) => {
    const tag = mark('santuario-financeiro');
    const create = await request.post('/api/marketplace/products', {
      headers: auth(TOKENS.space),
      data: { name: `Plano ${tag}`, price: 990, category: 'Finance', type: 'service' },
    });
    expect(create.status()).toBe(201);

    const list = await request.get('/api/marketplace/products?category=Finance', {
      headers: auth(TOKENS.space),
    });
    expect(list.ok()).toBeTruthy();
    const products = await list.json();
    expect(products.some((p: { name?: string }) => String(p.name || '').includes(tag))).toBeTruthy();
  });

  test('santuario_marketplace_eventos_retiros', async ({ request }) => {
    const tag = mark('retiro-market');
    const create = await request.post('/api/marketplace/products', {
      headers: auth(TOKENS.space),
      data: { name: `Retiro ${tag}`, price: 450, category: 'Retreats', type: 'event' },
    });
    expect(create.status()).toBe(201);
    const created = await create.json();
    const productId = String(created.id || '');
    expect(productId.length).toBeGreaterThan(0);

    const list = await request.get('/api/marketplace/products?category=Retreats', {
      headers: auth(TOKENS.space),
    });
    expect(list.ok()).toBeTruthy();
    const products = await list.json();
    expect(products.some((p: { id?: string }) => String(p.id || '') === productId)).toBeTruthy();
  });
});

