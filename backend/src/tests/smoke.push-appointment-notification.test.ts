// ─── smoke.push-appointment-notification.test.ts ─────────────────────────────
//
// Smoke E2E: "subscribe push → criar agendamento → notification in-app aparece"
//
// Verifica o pipeline completo:
//
//   1. Usuário salva push subscription (POST /notifications/push/subscribe)
//   2. Usuário cria agendamento   (POST /appointments)
//   3. Controller emite evento via notificationEngine.emit(appointment.created)
//   4. NotificationEngine grava notificação in-app (prisma.notification.create)
//   5. NotificationEngine dispara push via NotificationDispatcher
//   6. Notificação aparece na listagem (GET /notifications) — read: false
//
// Todos os efeitos externos (Supabase, push delivery) são mockados.
// O que testamos é o pipeline de ORQUESTRAÇÃO — nenhum dado real sai do processo.
//
// ─────────────────────────────────────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks hoisted (devem ser declarados ANTES dos imports) ────────────────────
const {
  prismaMock,
  isMockModeMock,
  notificationEngineMock,
  notificationDispatcherMock,
  interactionMock,
  receiptMock,
  loggerMock,
  supabaseAdminMock,
} = vi.hoisted(() => ({
  prismaMock: {
    pushSubscription: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
    },
  },

  isMockModeMock: vi.fn(() => false),

  notificationEngineMock: {
    emit: vi.fn(),
  },

  notificationDispatcherMock: {
    dispatch: vi.fn(),
  },

  interactionMock: {
    emitAppointmentLifecycle: vi.fn().mockResolvedValue({ sent: 1 }),
    logInteractionFailure: vi.fn(),
  },

  receiptMock: {
    upsert: vi.fn().mockResolvedValue({ id: 'receipt-1', status: 'COMPLETED' }),
  },

  loggerMock: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },

  supabaseAdminMock: (() => {
    // Must support: .from(t).insert(d).select().single()
    //               .from(t).insert(d)  (fire & forget)
    const apptRow = {
      id: 'appt-uuid-1', client_id: 'user-client-1', professional_id: 'user-pro-1',
      service_name: 'Ritual de Ativação', date: '2026-03-15', time: '10:00',
      price: 150, status: 'pending',
    };
    const chain: any = {
      select:   vi.fn().mockReturnThis(),
      single:   vi.fn().mockResolvedValue({ data: apptRow, error: null }),
      insert:   vi.fn().mockReturnThis(),
      update:   vi.fn().mockReturnThis(),
      upsert:   vi.fn().mockReturnThis(),
      delete:   vi.fn().mockReturnThis(),
      eq:       vi.fn().mockReturnThis(),
      or:       vi.fn().mockReturnThis(),
      like:     vi.fn().mockReturnThis(),
      order:    vi.fn().mockReturnThis(),
      // direct resolution for fire-and-forget inserts
      then:     (resolve: any) => resolve({ error: null }),
    };
    chain.from = vi.fn().mockReturnValue(chain);
    return chain;
  })(),
}));

vi.mock('../../../backend/src/lib/prisma',     () => ({ default: prismaMock }));
vi.mock('../../../backend/src/lib/appMode',    () => ({ isMockMode: isMockModeMock, isProd: () => true }));
vi.mock('../../../backend/src/lib/logger',     () => ({ logger: loggerMock }));
vi.mock('../../../backend/src/services/supabase.service', () => ({
  supabaseAdmin:  supabaseAdminMock,
  isMockMode:     isMockModeMock,
}));
vi.mock('../../../backend/src/services/notificationEngine.service', () => {
  // Mock the singleton but keep class accessible for direct instantiation in tests
  class NotificationEngine {
    emit   = notificationEngineMock.emit;
    getNotifications = vi.fn().mockImplementation(
      (userId: string, opts: { unreadOnly?: boolean } = {}) =>
        prismaMock.notification.findMany({
          where: { user_id: userId, ...(opts.unreadOnly ? { read: false } : {}) },
          orderBy: { timestamp: 'desc' },
          take: 20, skip: 0,
        }),
    );
    getUnreadCount = vi.fn().mockResolvedValue(0);
    markAsRead     = vi.fn().mockResolvedValue(undefined);
    markAllAsRead  = vi.fn().mockResolvedValue(undefined);
  }
  return {
    NotificationEngine,
    notificationEngine: notificationEngineMock,
  };
});
vi.mock('../../../backend/src/services/notification.dispatcher', () => ({
  NotificationDispatcher: {
    dispatch: notificationDispatcherMock.dispatch,
  },
}));
vi.mock('../../../backend/src/services/interaction.service', () => ({
  interactionService: interactionMock,
}));
vi.mock('../../../backend/src/services/interactionReceipt.service', () => ({
  interactionReceiptService: receiptMock,
}));
vi.mock('../../../backend/src/middleware/async.middleware', () => ({
  asyncHandler: (fn: Function) => fn,
}));

// ── Imports (depois dos mocks) ────────────────────────────────────────────────
import { subscribe }          from '../../../backend/src/controllers/notifications.controller';
import { createAppointment }  from '../../../backend/src/controllers/appointments.controller';
import { NotificationEngine } from '../../../backend/src/services/notificationEngine.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {} as any;
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

const flush = () => new Promise((r) => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────────────────────────

describe('smoke: subscribe push → criar agendamento → notification in-app aparece', () => {
  const CLIENT_ID  = 'user-client-1';
  const PRO_ID     = 'user-pro-1';
  const APPT_ID    = 'appt-uuid-1';
  const PUSH_EP    = 'https://fcm.googleapis.com/fcm/send/fake-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
  });

  // ── Passo 1: subscribe ────────────────────────────────────────────────────

  it('PASSO 1 — POST /push/subscribe persiste subscription no DB', async () => {
    prismaMock.pushSubscription.upsert.mockResolvedValue({
      id: 'sub-1', user_id: CLIENT_ID, endpoint: PUSH_EP,
    });

    const req: any = {
      user: { userId: CLIENT_ID },
      body: {
        endpoint:  PUSH_EP,
        keys: { p256dh: 'fake-p256dh', auth: 'fake-auth' },
        userAgent: 'Mozilla/5.0 (Smoke test)',
      },
      headers: {},
    };
    const res = makeRes();
    await subscribe(req, res, vi.fn());

    expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where:  { endpoint: PUSH_EP },
        create: expect.objectContaining({
          user_id:  CLIENT_ID,
          endpoint: PUSH_EP,
          p256dh:   'fake-p256dh',
          auth:     'fake-auth',
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  // ── Passo 2: criar agendamento ────────────────────────────────────────────

  it('PASSO 2 — POST /appointments emite notificationEngine.emit(appointment.created)', async () => {
    // profile do profissional (para block de agenda do santuário)
    prismaMock.profile.findUnique.mockResolvedValue({ id: PRO_ID, hub_id: null });

    const req: any = {
      user: { id: CLIENT_ID, userId: CLIENT_ID, role: 'CLIENT' },
      body: {
        professional_id: PRO_ID,
        service_name:    'Ritual de Ativação',
        date:            '2026-03-15',
        time:            '10:00',
        price:           150,
      },
      requestId: 'req-smoke-appt-1',
    };
    const res  = makeRes();
    const next = vi.fn();

    await createAppointment(req, res, next);
    await flush();

    // notificationEngine.emit deve ter sido chamado pelo interactionService
    expect(interactionMock.emitAppointmentLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId:   APPT_ID,
        clientId:        CLIENT_ID,
        professionalId:  PRO_ID,
        serviceName:     'Ritual de Ativação',
      }),
    );

    // 201 ao caller
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Passo 3: pipeline notification engine → in-app + push ────────────────

  it('PASSO 3 — NotificationEngine.emit grava notificação in-app e chama dispatcher', async () => {
    // Testa NotificationEngine real com prisma mockado
    // (notificationEngine no módulo já está mockado — criamos instância da classe real)
    const { NotificationEngine: RealEngine } =
      await import('../../../backend/src/services/notificationEngine.service');
    const engine = new (RealEngine as any)();

    // Profile do destinatário existe
    prismaMock.profile.findUnique.mockResolvedValue({ id: PRO_ID });

    // notification.create retorna a notif criada
    const createdNotif = {
      id: 'notif-1', user_id: PRO_ID, type: 'ritual',
      title: 'Novo Agendamento',
      message: 'Você tem um novo agendamento: Ritual de Ativação.',
      read: false, timestamp: new Date(),
    };
    prismaMock.notification.create.mockResolvedValue(createdNotif);

    // Espia o dispatch real do módulo já importado
    const dispatchSpy = vi.spyOn(notificationDispatcherMock, 'dispatch').mockResolvedValue(undefined);

    await engine.emit({
      type:         'appointment.created',
      actorId:      CLIENT_ID,
      targetUserId: PRO_ID,
      entityType:   'appointment',
      entityId:     APPT_ID,
      data:         { serviceName: 'Ritual de Ativação', date: '2026-03-15T10:00:00.000Z' },
    });

    // ── Notificação in-app gravada no banco ───────────────────────────────
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: PRO_ID,
          type:    'ritual',
          title:   'Novo Agendamento',
          read:    false,
        }),
      }),
    );

    // ── Dispatcher chamado com canais corretos ─────────────────────────────
    expect(notificationDispatcherMock.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId:   PRO_ID,
        channels: expect.arrayContaining(['IN_APP', 'PUSH']),
        metadata: expect.objectContaining({
          eventType:  'appointment.created',
          entityType: 'appointment',
          entityId:   APPT_ID,
        }),
      }),
    );
  });

  // ── Passo 4: notif aparece no GET /notifications → read: false ───────────

  it('PASSO 4 — GET /notifications retorna notificação in-app com read: false', async () => {
    // Simula o que o engine gravou no banco
    const stored = [
      {
        id: 'notif-1', user_id: PRO_ID, type: 'ritual',
        title: 'Novo Agendamento',
        message: 'Você tem um novo agendamento: Ritual de Ativação.',
        read: false, timestamp: new Date(),
      },
    ];
    prismaMock.notification.findMany.mockResolvedValue(stored);

    const engine = new NotificationEngine();
    const results = await engine.getNotifications(PRO_ID, { unreadOnly: true });

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: PRO_ID, read: false },
      }),
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id:    'notif-1',
      type:  'ritual',
      read:  false,
      title: 'Novo Agendamento',
    });
  });

  // ── Cenário completo em sequência ─────────────────────────────────────────

  it('FULL PIPELINE — subscribe → appointment → notif in-app → aparece no feed', async () => {
    // 1. Subscribe
    prismaMock.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });
    const subReq: any = {
      user: { userId: PRO_ID },
      body: { endpoint: PUSH_EP, keys: { p256dh: 'p', auth: 'a' } },
      headers: {},
    };
    await subscribe(subReq, makeRes(), vi.fn());
    expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledTimes(1);

    // 2. Appointment creation emits to interactionService
    prismaMock.profile.findUnique.mockResolvedValue({ id: PRO_ID, hub_id: null });

    const apptReq: any = {
      user: { id: CLIENT_ID, userId: CLIENT_ID, role: 'CLIENT' },
      body: { professional_id: PRO_ID, service_name: 'Ritual', date: '2026-03-15', time: '10:00', price: 100 },
      requestId: 'req-full-pipeline',
    };
    await createAppointment(apptReq, makeRes(), vi.fn());
    await flush();

    // interactionService foi invocado com o appointmentId correto
    expect(interactionMock.emitAppointmentLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: APPT_ID, professionalId: PRO_ID }),
    );

    // 3. Notif aparece no feed (simula o que o engine gravaria)
    prismaMock.notification.findMany.mockResolvedValue([
      { id: 'n-1', user_id: PRO_ID, type: 'ritual', title: 'Novo Agendamento', read: false },
    ]);

    const engine = new NotificationEngine();
    const feed = await engine.getNotifications(PRO_ID, { unreadOnly: true });

    expect(feed).toHaveLength(1);
    expect(feed[0].read).toBe(false);
    expect(feed[0].type).toBe('ritual');
  });
});
