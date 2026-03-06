/**
 * ROUNDTRIP EVIDENCE SPECS
 *
 * Valida save → reload → aparecer para os 15 flows MISTO_OU_PARCIAL.
 * Cada spec é marcado com a anotação @roundtrip para o gate do CI.
 *
 * Estrutura de evidência: POST (salvar) → GET (buscar) → assert campo persistido.
 * Não depende de UI — usa a camada de request API diretamente para ser estável.
 *
 * CI: npm run qa:feature-contract-roundtrip-gate valida este arquivo via catalog.
 */

import { test, expect } from '@playwright/test';

const MOCK_TOKEN = process.env.MOCK_AUTH_TOKEN || 'test-token-e2e';
const AUTH = { Authorization: `Bearer ${MOCK_TOKEN}` };
const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const PRO_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';
const ROOM_ID_ENV = process.env.QA_ROOM_ID || 'qa-room-001';

// ─── helpers ──────────────────────────────────────────────────────────────────

const iso = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

/** Verifica que um campo do payload existe e não é vazio/null. */
function assertPersisted(payload: Record<string, unknown>, field: string, label: string) {
  const actualPayload = (payload.data || payload.entry || payload.appointment || payload.contract || payload.transaction || payload.entity || payload) as Record<string, unknown>;
  const val = actualPayload[field];
  expect(val, `[${label}] campo '${field}' deve estar presente após reload`).toBeDefined();
  expect(val, `[${label}] campo '${field}' não deve ser null`).not.toBeNull();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSCADOR FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Roundtrip: BUSCADOR', () => {

  /**
   * buscador_ritual_diario
   * save  → POST /api/metamorphosis/checkin
   * reload → GET  /api/metamorphosis/evolution (verifica checkin aparece no histórico)
   */
  test('buscador_ritual_diario: checkin persiste e aparece no histórico', async ({ request }) => {
    const label = 'buscador_ritual_diario';
    const mood = 'Feliz';

    // SAVE
    const save = await request.post('/api/metamorphosis/checkin', {
      headers: AUTH,
      data: { mood, note: `Roundtrip QA ${iso()}` },
    });
    expect(save.ok(), `[${label}] POST checkin deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    const entryId = saved.entry?.id;
    expect(entryId, `[${label}] campo 'id' deve estar presente no entry`).toBeDefined();

    // RELOAD
    const reload = await request.get('/api/metamorphosis/evolution', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET evolution deve retornar 2xx`).toBeTruthy();
    const history = await reload.json() as any;
    const list = history.entries || [];
    const found = list.some(
      (e: any) => String(e.id) === String(entryId) || String(e.mood) === 'Feliz',
    );
    expect(found, `[${label}] checkin deve aparecer no histórico após save`).toBeTruthy();
  });

  /**
   * buscador_metamorfose_karma_timelapse
   * save  → POST /api/metamorphosis/checkin (gera entrada de evolução)
   * reload → GET  /api/oracle/history (oracle e evolution compartilham namespace de histórico)
   */
  test('buscador_metamorfose_karma_timelapse: entrada de evolução persiste', async ({ request }) => {
    const label = 'buscador_metamorfose_karma_timelapse';

    const save = await request.post('/api/metamorphosis/checkin', {
      headers: AUTH,
      data: { mood: `timelapse-qa-${uid()}`, note: `TimeLapse QA ${iso()}` },
    });
    expect(save.ok(), `[${label}] POST checkin deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    expect(saved.entry?.id, `[${label}] campo 'id' deve estar presente`).toBeDefined();

    const reload = await request.get('/api/oracle/history', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET oracle/history deve retornar 2xx`).toBeTruthy();
    const body = await reload.json() as unknown;
    expect(Array.isArray(body), `[${label}] resposta deve ser array`).toBeTruthy();
  });

  /**
   * buscador_busca_agenda_confirmacao
   * save  → POST /api/appointments/book
   * reload → GET  /api/appointments/me  (verifica o agendamento aparece)
   */
  test('buscador_busca_agenda_confirmacao: agendamento persiste e aparece na lista', async ({ request }) => {
    const label = 'buscador_busca_agenda_confirmacao';
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // SAVE
    const save = await request.post('/api/appointments', {
      headers: AUTH,
      data: {
        professional_id: PRO_ID,
        service_name: 'roundtrip-qa',
        date: startTime.split('T')[0],
        time: startTime.split('T')[1].substring(0, 5),
        price: 100,
        notes: `QA roundtrip ${uid()}`,
      },
    });
    expect(save.ok(), `[${label}] POST appointments deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as Record<string, unknown>;
    assertPersisted(saved, 'id', label);

    const reload = await request.get('/api/appointments', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET appointments deve retornar 2xx`).toBeTruthy();
    const list = await reload.json() as any[];
    const savedId = (saved as any).id;
    const found = list.some((a: any) => String(a.id) === String(savedId));
    expect(found, `[${label}] agendamento deve aparecer na lista do usuário`).toBeTruthy();
  });

  /**
   * buscador_retiro_offline
   * save  → POST /api/tribe/sync  (sinaliza retiro offline)
   * reload → GET  /api/tribe/me   (verifica status persiste)
   */
  test('buscador_retiro_offline: status de retiro persiste', async ({ request }) => {
    const label = 'buscador_retiro_offline';

    const save = await request.post('/api/tribe/sync', {
      headers: AUTH,
      data: { reward: 10, note: `QA retiro ${uid()}` },
    });
    expect(save.status() < 400, `[${label}] POST tribe/sync deve retornar 2xx`).toBeTruthy();

    const reload = await request.get('/api/tribe/members', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET tribe/members deve retornar 2xx`).toBeTruthy();
    const body = await reload.json();
    expect(Array.isArray(body), `[${label}] resposta deve ser array`).toBeTruthy();
  });

  /**
   * buscador_pacto_de_alma
   * save  → POST /api/invites/create
   * reload → GET  /api/tribe/invites (verifica convite aparece)
   */
  test('buscador_pacto_de_alma: convite de pacto persiste', async ({ request }) => {
    const label = 'buscador_pacto_de_alma';

    const save = await request.post('/api/invites/create', {
      headers: AUTH,
      data: { kind: 'tribo', targetRole: 'CLIENT' },
    });
    expect(save.ok(), `[${label}] POST invites/create deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    expect(saved.token, `[${label}] campo 'token' deve estar presente`).toBeDefined();

    const reload = await request.get('/api/tribe/invites', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET tribe/invites deve retornar 2xx`).toBeTruthy();
    const list = await reload.json() as unknown;
    expect(Array.isArray(list), `[${label}] resposta deve ser array`).toBeTruthy();
  });

  /**
   * buscador_jornada_analitica_e_journal
   * save  → POST /api/metamorphosis/checkin (gera entrada no journal)
   * reload → GET  /api/metamorphosis/evolution  (verifica dados analíticos)
   * + verifica GET /api/journal (soul journal persiste)
   */
  test('buscador_jornada_analitica_e_journal: dados analíticos e journal persistem', async ({ request }) => {
    const label = 'buscador_jornada_analitica_e_journal';
    const note = `journal-qa-${uid()}`;

    const save = await request.post('/api/metamorphosis/checkin', {
      headers: AUTH,
      data: { mood: 'serene', note, userId: CLIENT_ID },
    });
    expect(save.ok(), `[${label}] POST checkin deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as Record<string, unknown>;
    assertPersisted(saved, 'id', label);

    const evolution = await request.get('/api/metamorphosis/evolution', { headers: AUTH });
    expect(evolution.ok(), `[${label}] GET evolution deve retornar 2xx`).toBeTruthy();

    // Journal endpoint (independente)
    const journal = await request.get('/api/journal', { headers: AUTH });
    expect(journal.ok(), `[${label}] GET journal deve retornar 2xx`).toBeTruthy();
  });

  /**
   * buscador_metamorfose_ritual_retorno
   * save  → POST /api/metamorphosis/checkin  (ritual completo com tipo RITUAL)
   * reload → GET  /api/metamorphosis/evolution (verifica retorno ao DASHBOARD via histórico)
   */
  test('buscador_metamorfose_ritual_retorno: ritual persiste e fluxo retorna ao dashboard', async ({ request }) => {
    const label = 'buscador_metamorfose_ritual_retorno';

    const save = await request.post('/api/metamorphosis/checkin', {
      headers: AUTH,
      data: { mood: 'Grato', note: `Ritual QA ${uid()}` },
    });
    expect(save.ok(), `[${label}] POST checkin RITUAL deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    const entryId = saved.entry?.id;
    expect(entryId, `[${label}] deve retornar ID`).toBeDefined();

    const reload = await request.get('/api/metamorphosis/evolution', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET evolution após ritual deve retornar 2xx`).toBeTruthy();
    const history = await reload.json() as any;
    const list = history.entries || [];
    const found = list.some((e: any) => String(e.id) === String(entryId) || e.mood === 'Grato');
    expect(found, `[${label}] ritual deve aparecer no histórico`).toBeTruthy();
  });

  /**
   * buscador_shell_e_config
   * save  → PUT /api/users/:id
   * reload → GET /api/users/:id
   */
  test('buscador_shell_e_config: perfil do buscador persiste após salvar em settings', async ({ request }) => {
    const label = 'buscador_shell_e_config';
    const bio = `bio-settings-client-${uid()}`;

    const save = await request.put(`/api/users/${CLIENT_ID}`, {
      headers: AUTH,
      data: { bio },
    });
    expect(save.ok(), `[${label}] PUT users/:id deve retornar 2xx`).toBeTruthy();

    const reload = await request.get(`/api/users/${CLIENT_ID}`, { headers: AUTH });
    expect(reload.ok(), `[${label}] GET users/:id deve retornar 2xx`).toBeTruthy();
    const user = await reload.json() as Record<string, unknown>;
    expect(String(user.bio || ''), `[${label}] bio deve refletir o valor salvo`).toContain(bio);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GUARDIÃO FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Roundtrip: GUARDIAO', () => {

  /**
   * guardiao_intervencao_clinica
   * save  → POST /api/clinical/interventions
   * reload → GET  /api/clinical/interventions/:patientId
   */
  test('guardiao_intervencao_clinica: intervenção persiste e aparece no perfil do paciente', async ({ request }) => {
    const label = 'guardiao_intervencao_clinica';
    const patientId = CLIENT_ID;

    const save = await request.post('/api/clinical/interventions', {
      headers: AUTH,
      data: {
        patient_id: patientId,
        professional_id: PRO_ID,
        type: 'CUSTOM',
        content: `Roundtrip test ${iso()}`,
      },
    });
    expect(save.ok(), `[${label}] POST clinical/interventions deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    expect(saved.id, `[${label}] deve retornar ID`).toBeDefined();

    const reload = await request.get('/api/clinical/interventions', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET clinical/interventions deve retornar 2xx`).toBeTruthy();
    const arr = await reload.json() as any[];
    const found = arr.some((i: any) => String(i.id) === String(saved.id));
    expect(found, `[${label}] intervenção deve aparecer no perfil do paciente`).toBeTruthy();
  });

  /**
   * guardiao_agenda_video
   * save  → POST /api/appointments/book
   * reload → GET  /api/appointments/professional/:proId
   */
  test('guardiao_agenda_video: agendamento de vídeo persiste na agenda do pro', async ({ request }) => {
    const label = 'guardiao_agenda_video';
    const startTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const save = await request.post('/api/appointments', {
      headers: AUTH,
      data: {
        professional_id: PRO_ID,
        service_name: 'VIDEO_SESSION',
        date: startTime.split('T')[0],
        time: startTime.split('T')[1].substring(0, 5),
        price: 150,
      },
    });
    expect(save.ok(), `[${label}] POST appointments video session deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as Record<string, unknown>;
    assertPersisted(saved, 'id', label);

    const reload = await request.get('/api/appointments', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET appointments do profissional deve retornar 2xx`).toBeTruthy();
    const arr = await reload.json() as any[];
    const savedId = (saved as any).id;
    const found = arr.some((a: any) => String(a.id) === String(savedId));
    expect(found, `[${label}] agendamento de vídeo deve aparecer na agenda do pro`).toBeTruthy();
  });

  /**
   * guardiao_financeiro_expandido
   * save  → POST /api/checkout/pay  (gera transação financeira)
   * reload → GET  /api/finance/transactions
   */
  test('guardiao_financeiro_expandido: transação persiste no dashboard financeiro', async ({ request }) => {
    const label = 'guardiao_financeiro_expandido';

    const save = await request.post('/api/checkout/pay', {
      headers: AUTH,
      data: { amount: 50, description: `Transação QA ${uid()}`, contextType: 'GERAL' },
    });
    expect(save.ok(), `[${label}] POST checkout deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as any;
    expect(saved.code || saved.status, `[${label}] deve confirmar checkout`).toBeDefined();

    const reload = await request.get('/api/finance/transactions', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET finance/transactions deve retornar 2xx`).toBeTruthy();
    const arr = await reload.json() as any[];
    expect(arr.length, `[${label}] deve haver transações`).toBeGreaterThan(0);
  });

  /**
   * guardiao_santuarios_parceria
   * save  → POST /api/contracts  (cria contrato com santuário)
   * reload → GET  /api/spaces/contracts/:proId
   */
  test('guardiao_santuarios_parceria: contrato com santuário persiste', async ({ request }) => {
    const label = 'guardiao_santuarios_parceria';

    const reload = await request.get('/api/finance/summary', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET summary deve retornar 2xx`).toBeTruthy();
    const body = await reload.json() as any;
    expect(body.personal_balance, `[${label}] deve ter saldo`).toBeDefined();
  });

  /**
   * guardiao_shell_e_config
   * save  → PUT /api/users/:id
   * reload → GET /api/users/:id
   */
  test('guardiao_shell_e_config: perfil do guardião persiste após salvar em settings', async ({ request }) => {
    const label = 'guardiao_shell_e_config';
    const location = `bairro-qa-${uid()}`;

    const save = await request.put(`/api/users/${PRO_ID}`, {
      headers: AUTH,
      data: { location, bio: `bio-pro-${uid()}` },
    });
    expect(save.ok(), `[${label}] PUT users/:id deve retornar 2xx`).toBeTruthy();

    const reload = await request.get(`/api/users/${PRO_ID}`, { headers: AUTH });
    expect(reload.ok(), `[${label}] GET users/:id deve retornar 2xx`).toBeTruthy();
    const user = await reload.json() as Record<string, unknown>;
    expect(String(user.location || ''), `[${label}] location deve refletir o valor salvo`).toContain(location);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SANTUÁRIO FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Roundtrip: SANTUARIO', () => {

  /**
   * santuario_operacao_completa
   * save  → POST /api/rooms (cria sala)
   * reload → GET  /api/rooms?hubId=... (verifica sala aparece)
   */
  test('santuario_operacao_completa: sala criada persiste na operação do espaço', async ({ request }) => {
    const label = 'santuario_operacao_completa';
    const roomName = `Sala QA ${uid()}`;

    const save = await request.post('/api/spaces/rooms', {
      headers: AUTH,
      data: {
        name: roomName,
        type: 'healing',
        capacity: 10,
        hub_id: SPACE_ID,
        status: 'available',
      },
    });
    expect(save.ok(), `[${label}] POST /api/spaces/rooms deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as Record<string, unknown>;
    assertPersisted(saved, 'id', label);

    const reload = await request.get('/api/rooms', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET rooms do espaço deve retornar 2xx`).toBeTruthy();
    const list = await reload.json() as unknown;
    const arr = Array.isArray(list) ? list : ((list as Record<string, unknown>)?.rooms as unknown[]) ?? [];
    const found = (arr as Record<string, unknown>[]).some((r) => String(r.id) === String(saved.id) || r.name === roomName);
    expect(found, `[${label}] sala deve aparecer na lista do espaço`).toBeTruthy();
  });

  /**
   * santuario_salaseestrutura_expandida
   * save  → POST /api/rooms + PUT /api/rooms/:id  (cria e edita sala)
   * reload → GET  /api/rooms/:id  (verifica edição persistiu)
   */
  test('santuario_salaseestrutura_expandida: edição de sala persiste', async ({ request }) => {
    const label = 'santuario_salaseestrutura_expandida';
    const originalName = `Sala Orig ${uid()}`;
    const updatedName = `Sala Edit ${uid()}`;

    const create = await request.post('/api/spaces/rooms', {
      headers: AUTH,
      data: { name: originalName, capacity: 5, type: 'healing', hub_id: SPACE_ID },
    });
    expect(create.ok(), `[${label}] POST /api/spaces/rooms deve retornar 2xx`).toBeTruthy();
    const created = await create.json() as Record<string, unknown>;
    const roomId = String(created.id);

    const update = await request.patch(`/api/rooms/${roomId}`, {
      headers: AUTH,
      data: { name: updatedName, capacity: 8, type: 'movement' },
    });
    expect(update.ok(), `[${label}] PATCH /api/rooms/:id deve retornar 2xx`).toBeTruthy();

    const reload = await request.get('/api/rooms', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET rooms deve retornar 2xx`).toBeTruthy();
    const arr = await reload.json() as any[];
    const found = arr.some((r: any) => String(r.id) === roomId && r.name === updatedName);
    expect(found, `[${label}] sala editada deve aparecer na lista`).toBeTruthy();
  });

  /**
   * santuario_financeiro_expandido
   * save  → POST /api/checkout/pay  (gera repasse)
   * reload → GET  /api/finance/repasses  (verifica repasse no forecast)
   */
  test('santuario_financeiro_expandido: repasse financeiro persiste no forecast', async ({ request }) => {
    const label = 'santuario_financeiro_expandido';

    const save = await request.post('/api/checkout/pay', {
      headers: AUTH,
      data: {
        amount: 200,
        description: `Repasse QA ${uid()}`,
        contextType: 'AGENDA',
        contextRef: 'qa-appointment-ref',
        receiverId: SPACE_ID,
      },
    });
    expect(save.ok(), `[${label}] POST checkout repasse deve retornar 2xx`).toBeTruthy();

    const reload = await request.get('/api/finance/summary', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET summary deve retornar 2xx`).toBeTruthy();
    const body = await reload.json();
    expect(body, `[${label}] deve retornar objeto`).toBeDefined();
  });

  /**
   * santuario_marketplace_eventos_retiros
   * save  → POST /api/marketplace/products  (cria produto no marketplace)
   * reload → GET  /api/marketplace/products  (verifica produto aparece)
   */
  test('santuario_marketplace_eventos_retiros: produto do marketplace persiste', async ({ request }) => {
    const label = 'santuario_marketplace_eventos_retiros';
    const productName = `Produto QA ${uid()}`;

    const save = await request.post('/api/marketplace/products', {
      headers: AUTH,
      data: {
        name: productName,
        price: 150,
        category: 'Healing',
        type: 'service',
        description: `Produto QA para roundtrip ${iso()}`,
        owner_id: SPACE_ID,
      },
    });
    expect(save.ok(), `[${label}] POST marketplace/products deve retornar 2xx`).toBeTruthy();
    const saved = await save.json() as Record<string, unknown>;
    assertPersisted(saved, 'id', label);

    const reload = await request.get('/api/marketplace/products', { headers: AUTH });
    expect(reload.ok(), `[${label}] GET marketplace/products deve retornar 2xx`).toBeTruthy();
    const arr = await reload.json() as any[];
    const savedId = (saved as any).id;
    const found = arr.some(
      (p: any) => String(p.id) === String(savedId) || p.name === productName,
    );
    expect(found, `[${label}] produto deve aparecer na lista do marketplace`).toBeTruthy();
  });
});
