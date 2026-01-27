
import { describe, it, expect } from 'vitest';
import { screenMap } from '../navigation/screenMap';
import { transitions as buscadorTransitions } from '../flow/types';
import { guardiaoTransitions } from '../flow/guardiaoTypes';
import { santuarioTransitions } from '../flow/santuarioTypes';

// Extract all unique states from transitions
const getStates = (transitions: Record<string, any>) => Object.keys(transitions);

describe('Flow Coverage System', () => {
    
    describe('Buscador (Seeker) Coverage', () => {
        const states = getStates(buscadorTransitions);
        states.forEach(state => {
            if (state === 'END') return; // END state doesn't need a screen usually, or maps to START
            it(`should have a mapped screen for state: ${state}`, () => {
                const component = screenMap.BUSCADOR[state];
                expect(component).toBeDefined();
            });
        });

        it('should have 100% state coverage', () => {
            const mappedStates = Object.keys(screenMap.BUSCADOR);
            const requiredStates = states.filter(s => s !== 'END');
            const missing = requiredStates.filter(s => !mappedStates.includes(s));
            expect(missing).toEqual([]);
        });
    });

    describe('Guardião (Pro) Coverage', () => {
        const states = getStates(guardiaoTransitions);
        states.forEach(state => {
            if (state === 'END') return;
            it(`should have a mapped screen for state: ${state}`, () => {
                const component = screenMap.GUARDIAO[state];
                expect(component).toBeDefined();
            });
        });

        it('should have 100% state coverage', () => {
            const mappedStates = Object.keys(screenMap.GUARDIAO);
            const requiredStates = states.filter(s => s !== 'END');
            const missing = requiredStates.filter(s => !mappedStates.includes(s));
            expect(missing).toEqual([]);
        });
    });

    describe('Santuário (Space) Coverage', () => {
        const states = getStates(santuarioTransitions);
        states.forEach(state => {
            if (state === 'END') return;
            it(`should have a mapped screen for state: ${state}`, () => {
                const component = screenMap.SANTUARIO[state];
                expect(component).toBeDefined();
            });
        });

        it('should have 100% state coverage', () => {
            const mappedStates = Object.keys(screenMap.SANTUARIO);
            const requiredStates = states.filter(s => s !== 'END');
            const missing = requiredStates.filter(s => !mappedStates.includes(s));
            expect(missing).toEqual([]);
        });
    });
});
