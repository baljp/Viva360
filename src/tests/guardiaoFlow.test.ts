
import { describe, test, expect, beforeEach } from 'vitest';
import { GuardiaoFlowEngine } from '../flow/GuardiaoFlowEngine';

describe('GuardiaoFlowEngine', () => {
    let engine: GuardiaoFlowEngine;

    beforeEach(() => {
        engine = new GuardiaoFlowEngine();
    });

    test('should start at START state', () => {
        expect(engine.getState()).toBe('START');
    });

    test('should transition to DASHBOARD', () => {
        engine.transition('DASHBOARD');
        expect(engine.getState()).toBe('DASHBOARD');
    });

    test('should allow complex flow: Dashboard -> Agenda -> Confirm -> View', () => {
        engine.transition('DASHBOARD');
        engine.transition('AGENDA_VIEW');
        engine.transition('AGENDA_CONFIRM');
        expect(engine.getState()).toBe('AGENDA_CONFIRM');
        
        engine.transition('AGENDA_VIEW'); // Back to view
        expect(engine.getState()).toBe('AGENDA_VIEW');
    });

    test('should block invalid jumps (Start -> Finance)', () => {
        const success = engine.transition('FINANCE_OVERVIEW');
        expect(success).toBe(false);
        expect(engine.getState()).toBe('START');
    });

    test('should handle Escambo Flow', () => {
        engine.transition('DASHBOARD');
        engine.transition('ESCAMBO_MARKET');
        engine.transition('ESCAMBO_PROPOSE');
        engine.transition('ESCAMBO_CONFIRM');
        expect(engine.getState()).toBe('ESCAMBO_CONFIRM');
        
        // Loop back to dashboard or market
        const backToDash = engine.transition('DASHBOARD');
        expect(backToDash).toBe(true);
    });

    test('should maintain history stack', () => {
        engine.transition('DASHBOARD');
        engine.transition('PATIENTS_LIST');
        engine.transition('PATIENT_PROFILE');
        
        expect(engine.getState()).toBe('PATIENT_PROFILE');
        
        engine.back();
        expect(engine.getState()).toBe('PATIENTS_LIST');
        
        engine.back();
        expect(engine.getState()).toBe('DASHBOARD');
    });
});
