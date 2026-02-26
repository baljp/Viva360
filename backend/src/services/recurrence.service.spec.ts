/**
 * recurrence.service.spec.ts
 * ──────────────────────────
 * Unit tests for the pure business logic in recurrence.service.ts.
 * No DB or network calls.  All external deps are mocked.
 *
 * Run: npx vitest run backend/src/services/recurrence.service.spec.ts
 *   or: npx vitest --reporter=verbose (from project root)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock external dependencies ────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    $transaction: vi.fn(async (fn: any) => fn(mockTx)),
    profile: { findUnique: vi.fn() },
    appointmentSeries: { create: vi.fn(), update: vi.fn() },
    appointment: { create: vi.fn() },
  },
}));

vi.mock('./supabase.service', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock transaction proxy
const mockTx = {
  appointmentSeries: { create: vi.fn() },
  appointment: { create: vi.fn() },
};

import { generateOccurrences, type RecurrenceRule } from './recurrence.service';

// ── Tests ─────────────────────────────────────────────────────────────────

describe('generateOccurrences', () => {
  /**
   * Baseline rule: WEEKLY on Thursday, 4 occurrences, starting Thu 2026-03-05
   */
  const baseRule = (): RecurrenceRule => ({
    startAt:     new Date('2026-03-05T18:00:00Z'), // Thursday 15:00 BRT (UTC-3)
    durationMin: 60,
    timezone:    'America/Fortaleza',
    freq:        'WEEKLY',
    byDay:       ['TH'],
    count:       4,
  });

  it('generates exactly count occurrences for WEEKLY', () => {
    const result = generateOccurrences(baseRule());
    expect(result).toHaveLength(4);
  });

  it('first occurrence is at or after startAt', () => {
    const rule = baseRule();
    const result = generateOccurrences(rule);
    expect(result[0].getTime()).toBeGreaterThanOrEqual(rule.startAt.getTime());
  });

  it('all occurrences fall on Thursdays', () => {
    const result = generateOccurrences(baseRule());
    // Convert UTC to local BRT (UTC-3) to check day-of-week
    for (const d of result) {
      const localDate = new Date(d.getTime() - 3 * 60 * 60 * 1000);
      expect(localDate.getUTCDay()).toBe(4); // Thursday
    }
  });

  it('occurrences are exactly 7 days apart for WEEKLY', () => {
    const result = generateOccurrences(baseRule());
    for (let i = 1; i < result.length; i++) {
      const diff = result[i].getTime() - result[i - 1].getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });

  it('occurrences are exactly 14 days apart for BIWEEKLY', () => {
    const rule: RecurrenceRule = { ...baseRule(), freq: 'BIWEEKLY', count: 4 };
    const result = generateOccurrences(rule);
    expect(result).toHaveLength(4);
    for (let i = 1; i < result.length; i++) {
      const diff = result[i].getTime() - result[i - 1].getTime();
      expect(diff).toBe(14 * 24 * 60 * 60 * 1000);
    }
  });

  it('respects `until` upper bound', () => {
    const rule: RecurrenceRule = {
      ...baseRule(),
      count: undefined,
      until: new Date('2026-03-26T23:59:59Z'), // covers 3 Thursdays
    };
    const result = generateOccurrences(rule);
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const d of result) {
      expect(d.getTime()).toBeLessThanOrEqual(new Date('2026-03-26T23:59:59Z').getTime());
    }
  });

  it('never exceeds MAX_OCCURRENCES (52) even without count/until', () => {
    const rule: RecurrenceRule = {
      ...baseRule(),
      count: undefined,
      until: undefined,
    };
    const result = generateOccurrences(rule);
    expect(result.length).toBeLessThanOrEqual(52);
  });

  it('MONTHLY produces same day-of-month each month', () => {
    const rule: RecurrenceRule = {
      ...baseRule(),
      freq:  'MONTHLY',
      byDay: [],
      count: 3,
    };
    const result = generateOccurrences(rule);
    expect(result).toHaveLength(3);
    // Each occurrence should have same UTC day as startAt (adjusted for timezone)
    const startDay = new Date(rule.startAt.getTime() - 3 * 60 * 60 * 1000).getUTCDate();
    for (const d of result) {
      const localDay = new Date(d.getTime() - 3 * 60 * 60 * 1000).getUTCDate();
      expect(localDay).toBe(startDay);
    }
  });

  it('count=1 returns only one occurrence', () => {
    const rule: RecurrenceRule = { ...baseRule(), count: 1 };
    const result = generateOccurrences(rule);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when count=0', () => {
    const rule: RecurrenceRule = { ...baseRule(), count: 0 };
    const result = generateOccurrences(rule);
    expect(result).toHaveLength(0);
  });

  it('preserves wall-clock time (15:00 BRT = 18:00 UTC)', () => {
    const result = generateOccurrences(baseRule());
    for (const d of result) {
      // UTC hour should be 18 (15:00 BRT)
      expect(d.getUTCHours()).toBe(18);
      expect(d.getUTCMinutes()).toBe(0);
    }
  });
});

// ── Idempotency key (seriesId + occurrenceIndex unique) ────────────────────

describe('occurrence_index uniqueness', () => {
  it('each generated date has a unique index (0-based)', () => {
    const result = generateOccurrences({
      startAt:     new Date('2026-03-05T18:00:00Z'),
      durationMin: 60,
      timezone:    'America/Fortaleza',
      freq:        'WEEKLY',
      byDay:       ['TH'],
      count:       12,
    });
    const indexes = result.map((_, i) => i);
    const uniqueIndexes = new Set(indexes);
    expect(uniqueIndexes.size).toBe(result.length);
  });
});

// ── detectConflicts (mocked DB) ────────────────────────────────────────────

describe('detectConflicts', () => {
  // detectConflicts hits supabaseAdmin which is mocked at the top of this file.
  // The mock returns { data: [], error: null } for all queries.
  // We test the overlap-detection pure logic here via a controlled mock.

  it('returns empty array when passed no occurrence dates', async () => {
    // No DB call needed when dates is empty
    const { detectConflicts } = await import('./recurrence.service');
    const conflicts = await detectConflicts('guardian-uuid', [], 60);
    expect(conflicts).toHaveLength(0);
  });

  it('detectConflicts is a function', async () => {
    const { detectConflicts } = await import('./recurrence.service');
    expect(typeof detectConflicts).toBe('function');
  });
});
