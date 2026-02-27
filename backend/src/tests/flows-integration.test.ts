/**
 * POL-12: Integration tests for critical API flows
 * FLOW-01: VagasList → GET /rooms/vacancies + POST /recruitment/applications
 * FLOW-04: SpaceSummon → POST /tribe/invite
 * FLOW-05: ServiceEvaluation → POST /reviews
 * FLOW-06: AlquimiaProposeTrade → POST /alchemy/offers
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const { prismaMock, isMockModeMock, receiptMock, interactionMock, tribeServiceMock, loggerMock } = vi.hoisted(() => ({
  prismaMock: {
    vacancy: { findMany: vi.fn() },
    application: { create: vi.fn(), findFirst: vi.fn() },
    event: { create: vi.fn() },
    swapOffer: { create: vi.fn(), findMany: vi.fn() },
  },
  isMockModeMock: vi.fn(),
  receiptMock: { upsert: vi.fn().mockResolvedValue({ id: 'receipt-1', status: 'COMPLETED' }) },
  interactionMock: { log: vi.fn().mockResolvedValue({ id: 'int-1' }), emitEscamboOffer: vi.fn().mockResolvedValue(undefined), logInteractionFailure: vi.fn() },
  tribeServiceMock: { inviteMember: vi.fn() },
  loggerMock: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../lib/appMode', () => ({ isMockMode: isMockModeMock }));
vi.mock('../services/supabase.service', () => ({ supabaseAdmin: { auth: { getUser: vi.fn() } } }));
vi.mock('../services/interactionReceipt.service', () => ({ interactionReceiptService: receiptMock }));
vi.mock('../services/interaction.service', () => ({ interactionService: interactionMock }));
vi.mock('../services/tribe.service', () => ({ tribeService: tribeServiceMock }));
vi.mock('../lib/logger', () => ({ logger: loggerMock }));
vi.mock('../services/audit.service', () => ({ AuditService: { logAccess: vi.fn() } }));
vi.mock('../services/notificationEngine.service', () => ({ notificationEngine: { emit: vi.fn() } }));

// ── Imports (after mocks) ──────────────────────────────────────────────
import { listVacancies } from '../controllers/rooms.controller';
import { createApplication } from '../controllers/recruitment.controller';
import { inviteMember } from '../controllers/tribe.controller';
import { createReview } from '../controllers/reviews.controller';
import { createOffer } from '../controllers/alchemy.controller';

// ── Helpers ────────────────────────────────────────────────────────────
const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};
const flush = () => new Promise((r) => setTimeout(r, 0));

// ════════════════════════════════════════════════════════════════════════
// FLOW-01: VagasList → GET /rooms/vacancies + POST /recruitment/applications
// ════════════════════════════════════════════════════════════════════════
describe('FLOW-01: VagasList + Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
  });

  describe('GET /rooms/vacancies (listVacancies)', () => {
    it('returns vacancies from Prisma in real mode', async () => {
      const vacancies = [
        { id: 'v-1', title: 'Psicólogo(a)', description: 'Atendimento clínico', specialties: ['Psicologia'] },
        { id: 'v-2', title: 'Yoga Instructor', description: 'Aulas matutinas', specialties: ['Yoga'] },
      ];
      prismaMock.vacancy.findMany.mockResolvedValue(vacancies);

      const req: any = { user: { userId: 'user-1' }, query: {} };
      const res = makeRes();
      const next = vi.fn();

      listVacancies(req, res, next);
      await flush();

      expect(prismaMock.vacancy.findMany).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(vacancies);
    });

    it('returns mock data when mock mode is active', async () => {
      isMockModeMock.mockReturnValue(true);

      const req: any = { user: { userId: 'user-1' }, query: {} };
      const res = makeRes();
      const next = vi.fn();

      listVacancies(req, res, next);
      await flush();

      expect(prismaMock.vacancy.findMany).not.toHaveBeenCalled();
      const data = res.json.mock.calls[0][0];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('title');
    });
  });

  describe('POST /recruitment/applications (createApplication)', () => {
    it('creates application with interaction receipt in mock mode', async () => {
      isMockModeMock.mockReturnValue(true);

      const req: any = {
        user: { userId: 'candidate-1' },
        body: { vacancyId: 'v-1', notes: 'Tenho experiência' },
        requestId: 'req-001',
      };
      const res = makeRes();
      const next = vi.fn();

      createApplication(req, res, next);
      await flush();

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.code).toBe('APPLICATION_CREATED');
      expect(body.application).toMatchObject({
        vacancy_id: 'v-1',
        candidate_id: 'candidate-1',
        status: 'APPLIED',
      });
      expect(body.actionReceipt).toBeDefined();
      expect(receiptMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'RECRUITMENT_APPLICATION',
          action: 'APPLY',
          actorId: 'candidate-1',
        }),
      );
    });

    it('rejects invalid body (missing vacancyId)', async () => {
      const req: any = {
        user: { userId: 'candidate-1' },
        body: {},
        requestId: 'req-002',
      };
      const res = makeRes();
      const next = vi.fn();

      createApplication(req, res, next);
      await flush();

      // Zod validation should cause next(error) or 400
      const called400 = res.status.mock.calls.some((c: any) => c[0] === 400);
      const calledNext = next.mock.calls.length > 0;
      expect(called400 || calledNext).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
// FLOW-04: SpaceSummon → POST /tribe/invite
// ════════════════════════════════════════════════════════════════════════
describe('FLOW-04: SpaceSummon (tribe invite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
  });

  it('creates invite with receipt on success', async () => {
    const invite = {
      id: 'inv-1',
      email: 'guardian@test.com',
      invite_type: 'TEAM',
      target_role: 'PROFESSIONAL',
      hub_id: 'space-1',
      status: 'PENDING',
    };
    tribeServiceMock.inviteMember.mockResolvedValue(invite);

    const req: any = {
      user: { userId: 'space-1' },
      body: { email: 'guardian@test.com', inviteType: 'TEAM', targetRole: 'PROFESSIONAL' },
      requestId: 'req-004',
    };
    const res = makeRes();
    const next = vi.fn();

    inviteMember(req, res, next);
    await flush();

    expect(tribeServiceMock.inviteMember).toHaveBeenCalledWith(
      'space-1',
      'guardian@test.com',
      expect.objectContaining({ inviteType: 'TEAM', targetRole: 'PROFESSIONAL' }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe('TRIBE_INVITE_CREATED');
    expect(body.invite.email).toBe('guardian@test.com');
    expect(receiptMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'TRIBE_INVITE', action: 'CREATE' }),
    );
  });

  it('rejects invalid email', async () => {
    const req: any = {
      user: { userId: 'space-1' },
      body: { email: 'not-an-email' },
      requestId: 'req-005',
    };
    const res = makeRes();
    const next = vi.fn();

    inviteMember(req, res, next);
    await flush();

    expect(tribeServiceMock.inviteMember).not.toHaveBeenCalled();
    const called400 = res.status.mock.calls.some((c: any) => c[0] === 400);
    const calledNext = next.mock.calls.length > 0;
    expect(called400 || calledNext).toBe(true);
  });

  it('returns 403 when non-sanctuary tries to invite', async () => {
    tribeServiceMock.inviteMember.mockRejectedValue(
      new Error('Only Sanctuaries can invite team members'),
    );

    const req: any = {
      user: { userId: 'pro-1' },
      body: { email: 'someone@test.com', inviteType: 'TEAM' },
      requestId: 'req-006',
    };
    const res = makeRes();
    const next = vi.fn();

    inviteMember(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ════════════════════════════════════════════════════════════════════════
// FLOW-05: ServiceEvaluation → POST /reviews
// ════════════════════════════════════════════════════════════════════════
describe('FLOW-05: ServiceEvaluation (create review)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
  });

  it('creates review event via Prisma in real mode', async () => {
    const created = {
      id: 'evt-1',
      stream_id: 'user-1',
      type: 'REVIEW_SUBMITTED',
      payload: { rating: 9.5, comment: 'Excelente', targetId: 'pro-1' },
      created_at: new Date(),
    };
    prismaMock.event = { create: vi.fn().mockResolvedValue(created) } as any;

    const req: any = {
      user: { userId: 'user-1', email: 'user@test.com' },
      body: {
        rating: 9.5,
        comment: 'Excelente atendimento',
        targetId: 'pro-1',
        targetName: 'Ana Luz',
        targetType: 'guardian',
        spaceId: 'space-1',
        tags: ['empatia', 'pontualidade'],
      },
    };
    const res = makeRes();
    const next = vi.fn();

    createReview(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    expect((prismaMock.event as any).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stream_id: 'user-1',
          type: 'REVIEW_SUBMITTED',
          payload: expect.objectContaining({
            rating: 9.5,
            targetType: 'guardian',
            spaceId: 'space-1',
          }),
        }),
      }),
    );
  });

  it('returns mock review when mock mode is active', async () => {
    isMockModeMock.mockReturnValue(true);

    const req: any = {
      user: { userId: 'user-1', email: 'user@test.com' },
      body: { rating: 8, comment: 'Bom', targetId: 'pro-1', spaceId: 'sp-1' },
    };
    const res = makeRes();
    const next = vi.fn();

    createReview(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.id).toMatch(/^mock-review-/);
    expect(body.rating).toBe(8);
  });

  it('rejects review without authentication', async () => {
    const req: any = {
      user: {},
      body: { rating: 8, targetId: 'pro-1' },
    };
    const res = makeRes();
    const next = vi.fn();

    createReview(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('validates rating range (0-10)', async () => {
    const req: any = {
      user: { userId: 'user-1', email: 'u@t.com' },
      body: { rating: 15, targetId: 'pro-1' },
    };
    const res = makeRes();
    const next = vi.fn();

    createReview(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('requires targetId or spaceId', async () => {
    const req: any = {
      user: { userId: 'user-1', email: 'u@t.com' },
      body: { rating: 7, comment: 'ok' },
    };
    const res = makeRes();
    const next = vi.fn();

    createReview(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ════════════════════════════════════════════════════════════════════════
// FLOW-06: AlquimiaProposeTrade → POST /alchemy/offers
// ════════════════════════════════════════════════════════════════════════
describe('FLOW-06: AlquimiaProposeTrade (create offer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMockModeMock.mockReturnValue(false);
  });

  it('creates swap offer in mock mode with receipt', async () => {
    isMockModeMock.mockReturnValue(true);

    const req: any = {
      user: { userId: 'pro-1' },
      body: { requesterId: 'pro-2', description: 'Troca de 2 sessões Reiki por 1 Yoga' },
      requestId: 'req-alchemy-1',
    };
    const res = makeRes();
    const next = vi.fn();

    createOffer(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe('ESCAMBO_CREATED');
    expect(body.provider_id).toBe('pro-1');
    expect(body.requester_id).toBe('pro-2');
    expect(body.status).toBe('pending');
    expect(body.actionReceipt).toBeDefined();
    expect(receiptMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'ESCAMBO',
        action: 'CREATE',
        actorId: 'pro-1',
        nextStep: 'AWAIT_RECEIVER_RESPONSE',
      }),
    );
  });

  it('creates swap offer via Prisma in real mode', async () => {
    const offer = {
      id: 'offer-1',
      provider_id: 'pro-1',
      requester_id: 'pro-2',
      description: 'Troca energética',
      status: 'pending',
      created_at: new Date(),
    };
    prismaMock.swapOffer.create.mockResolvedValue(offer);

    const req: any = {
      user: { userId: 'pro-1' },
      body: { requesterId: 'pro-2', description: 'Troca energética' },
      requestId: 'req-alchemy-2',
    };
    const res = makeRes();
    const next = vi.fn();

    createOffer(req, res, next);
    await flush();

    expect(prismaMock.swapOffer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider_id: 'pro-1',
          requester_id: 'pro-2',
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
