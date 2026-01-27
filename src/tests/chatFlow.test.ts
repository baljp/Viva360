
import { describe, it, expect } from 'vitest';
import { screenMap } from '../navigation/screenMap';
import { transitions } from '../flow/types';
import { guardiaoTransitions } from '../flow/guardiaoTypes';

describe('Chat Flow Integration', () => {

    it('should have CHAT states defined in transitions', () => {
        expect(transitions.CHAT_LIST).toBeDefined();
        expect(transitions.CHAT_ROOM).toBeDefined();
    });

    it('should allow transition from DASHBOARD to CHAT_LIST', () => {
        expect(transitions.DASHBOARD).toContain('CHAT_LIST');
    });

    it('should allow transition from CHAT_LIST to CHAT_ROOM', () => {
        expect(transitions.CHAT_LIST).toContain('CHAT_ROOM');
    });

    it('should map CHAT_LIST to a component', () => {
        expect(screenMap.BUSCADOR.CHAT_LIST).toBeDefined();
    });

    it('should map CHAT_ROOM to a component', () => {
        expect(screenMap.BUSCADOR.CHAT_ROOM).toBeDefined();
    });

    // Guardião Tests
    it('should allow transition from DASHBOARD to TRIBE_PRO then CHAT_LIST', () => {
         expect(guardiaoTransitions.DASHBOARD).toContain('TRIBE_PRO');
         expect(guardiaoTransitions.TRIBE_PRO).toContain('CHAT_LIST');
    });

    it('should map Guardião CHAT states to components', () => {
        expect(screenMap.GUARDIAO.CHAT_LIST).toBeDefined();
        expect(screenMap.GUARDIAO.CHAT_ROOM).toBeDefined();
    });
});
