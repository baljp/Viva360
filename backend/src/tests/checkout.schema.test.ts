import { describe, expect, it } from 'vitest';
import { checkoutSchema } from '../schemas/checkout.schema';

describe('checkout schema contracts', () => {
  it('requires contextRef for non-bazar contexts', () => {
    const parsed = checkoutSchema.safeParse({
      body: {
        amount: 10,
        description: 'Fluxo contextual',
        contextType: 'ESCAMBO',
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts bazar checkout without contextRef', () => {
    const parsed = checkoutSchema.safeParse({
      body: {
        amount: 10,
        description: 'Fluxo bazar',
        contextType: 'BAZAR',
      },
    });

    expect(parsed.success).toBe(true);
  });
});
