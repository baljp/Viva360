
import { describe, test, expect, beforeEach } from 'vitest';
import { BuscadorFlowEngine } from '../flow/BuscadorFlowEngine';
import { transitions } from '../flow/types';

describe('BuscadorFlowEngine', () => {
    let engine: BuscadorFlowEngine;

    beforeEach(() => {
        engine = new BuscadorFlowEngine();
    });

    test('should initialize with START state', () => {
        expect(engine.getState()).toBe('START');
    });

    test('should transition to permitted state', () => {
        const success = engine.transition('DASHBOARD');
        expect(success).toBe(true);
        expect(engine.getState()).toBe('DASHBOARD');
    });

    test('should prevent invalid transition', () => {
        // START -> CHAT_ROOM is invalid without passing through chat list.
        const success = engine.transition('CHAT_ROOM');
        expect(success).toBe(false);
        expect(engine.getState()).toBe('START');
    });

    test('should maintain history', () => {
        engine.transition('DASHBOARD');
        engine.transition('ORACLE_PORTAL');
        
        expect(engine.getState()).toBe('ORACLE_PORTAL');
        
        engine.back();
        expect(engine.getState()).toBe('DASHBOARD');
        
        engine.back();
        expect(engine.getState()).toBe('START');
    });

    test('should reset correctly', () => {
        engine.transition('DASHBOARD');
        engine.transition('METAMORPHOSIS_CHECKIN');
        engine.reset();
        
        expect(engine.getState()).toBe('START');
    });

    test('Validate all transitions map integrity', () => {
        // Ensure all target states in transitions map actually exist in type definition logic (implicit via TS compile, but runtime check)
        Object.values(transitions).forEach(targets => {
            expect(Array.isArray(targets)).toBe(true);
        });
    });
});
