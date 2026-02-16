import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    interactionReceipt: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../lib/prisma', () => ({
  default: prismaMock,
}));

import { interactionReceiptService } from '../services/interactionReceipt.service';

describe('interactionReceiptService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('normalizes and persists receipts', async () => {
    prismaMock.interactionReceipt.upsert.mockResolvedValue({
      id: 'receipt-1',
      entity_type: 'CHECKOUT',
      entity_id: 'tx-1',
      action: 'PAY',
      actor_id: '11111111-1111-4111-8111-111111111111',
      status: 'COMPLETED',
      next_step: 'NONE',
      request_id: 'req-1',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    });

    const receipt = await interactionReceiptService.upsert({
      entityType: 'checkout',
      entityId: 'tx-1',
      action: 'pay',
      actorId: '11111111-1111-4111-8111-111111111111',
      status: 'COMPLETED',
      nextStep: 'NONE',
      requestId: 'req-1',
      payload: { ok: true },
    });

    expect(prismaMock.interactionReceipt.upsert).toHaveBeenCalledTimes(1);
    expect(receipt.entityType).toBe('CHECKOUT');
    expect(receipt.action).toBe('PAY');
    expect(receipt.status).toBe('COMPLETED');
  });

  it('uses safe fallback when db auth circuit breaker is open in test runtime', async () => {
    prismaMock.interactionReceipt.upsert.mockRejectedValue(new Error('FATAL: Circuit breaker open: Too many authentication errors'));

    const receipt = await interactionReceiptService.upsert({
      entityType: 'checkout',
      entityId: 'tx-2',
      action: 'pay',
      actorId: '11111111-1111-4111-8111-111111111111',
      status: 'completed',
    });

    expect(receipt.id).toBeTruthy();
    expect(receipt.entityType).toBe('CHECKOUT');
    expect(receipt.action).toBe('PAY');
    expect(receipt.status).toBe('COMPLETED');
  });
});
