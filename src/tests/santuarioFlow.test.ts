
import { describe, test, expect, beforeEach } from 'vitest';
import { SantuarioFlowEngine } from '../flow/SantuarioFlowEngine';

describe('SantuarioFlowEngine', () => {
    let engine: SantuarioFlowEngine;

    beforeEach(() => {
        engine = new SantuarioFlowEngine();
    });

    test('should start at START state', () => {
        expect(engine.getState()).toBe('START');
    });

    test('should transition to EXEC_DASHBOARD', () => {
        engine.transition('EXEC_DASHBOARD');
        expect(engine.getState()).toBe('EXEC_DASHBOARD');
    });

    test('should allow Finance Flow', () => {
        engine.transition('EXEC_DASHBOARD');
        engine.transition('FINANCE_OVERVIEW');
        engine.transition('FINANCE_FORECAST');
        expect(engine.getState()).toBe('FINANCE_FORECAST');
        
        engine.back();
        expect(engine.getState()).toBe('FINANCE_OVERVIEW');
    });

    test('should allow HR/Vagas Flow', () => {
        engine.transition('EXEC_DASHBOARD');
        engine.transition('VAGAS_LIST');
        engine.transition('VAGA_CREATE');
        expect(engine.getState()).toBe('VAGA_CREATE');
    });

    test('should block invalid jumps', () => {
        // Start -> Finance (Invalid, must go through Dashboard)
        const success = engine.transition('FINANCE_OVERVIEW');
        expect(success).toBe(false);
        expect(engine.getState()).toBe('START');
    });
});
