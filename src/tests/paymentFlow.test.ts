
import { describe, it, expect } from 'vitest';
import { transitions as buscadorTransitions, BuscadorState } from '../flow/types';
import { guardiaoTransitions, GuardiaoState } from '../flow/guardiaoTypes';

describe('Payment Flow Transitions', () => {
  describe('Buscador (Client)', () => {
    it('should navigate from BOOKING_CONFIRM to CHECKOUT', () => {
      const allowed = buscadorTransitions['BOOKING_CONFIRM'];
      expect(allowed).toContain('CHECKOUT');
    });

    it('should navigate from CHECKOUT to PAYMENT_SUCCESS', () => {
      const allowed = buscadorTransitions['CHECKOUT'];
      expect(allowed).toContain('PAYMENT_SUCCESS');
    });

    it('should navigate from PAYMENT_SUCCESS to PAYMENT_HISTORY or DASHBOARD', () => {
      const allowed = buscadorTransitions['PAYMENT_SUCCESS'];
      expect(allowed).toContain('PAYMENT_HISTORY');
      expect(allowed).toContain('DASHBOARD');
    });

    it('should navigate from DASHBOARD to PAYMENT_HISTORY', () => {
      const allowed = buscadorTransitions['DASHBOARD'];
      expect(allowed).toContain('PAYMENT_HISTORY');
    });

    it('should allow returning to DASHBOARD from PAYMENT_HISTORY', () => {
      const allowed = buscadorTransitions['PAYMENT_HISTORY'];
      expect(allowed).toContain('DASHBOARD');
    });
  });

  describe('Guardião (Pro)', () => {
    it('should navigate from DASHBOARD to FINANCIAL_DASHBOARD', () => {
      const allowed = guardiaoTransitions['DASHBOARD'];
      expect(allowed).toContain('FINANCIAL_DASHBOARD');
    });

    it('should allow returning to DASHBOARD from FINANCIAL_DASHBOARD', () => {
      const allowed = guardiaoTransitions['FINANCIAL_DASHBOARD'];
      expect(allowed).toContain('DASHBOARD');
    });
  });
});
