
import { BuscadorState, transitions } from './types';
import { captureFrontendMessage } from '../../lib/frontendLogger';

export class BuscadorFlowEngine {
    public currentState: BuscadorState;
    public history: BuscadorState[];

    constructor(initialState: BuscadorState = 'START', initialHistory: BuscadorState[] = []) {
        this.currentState = initialState;
        this.history = initialHistory;
    }

    public getState(): BuscadorState {
        return this.currentState;
    }

    public canTransitionTo(target: BuscadorState): boolean {
        const allowed = transitions[this.currentState];
        return allowed?.includes(target) ?? false;
    }

    public transition(target: BuscadorState): boolean {
        if (!this.canTransitionTo(target)) {
            captureFrontendMessage('flow.transition.blocked', {
                domain: 'flow',
                engine: 'buscador',
                from: this.currentState,
                to: target,
            });
            return false;
        }
        this.history.push(this.currentState);
        this.currentState = target;
        return true;
    }

    public back(): boolean {
        if (this.history.length === 0) return false;
        const previous = this.history.pop();
        if (previous) {
            this.currentState = previous;
            return true;
        }
        return false;
    }

    public reset(): void {
        this.currentState = 'START';
        this.history = [];
    }

    // Helpers for specific flows logic
    public getProgress(): number {
        // Example logic: rough progress based on state depth or completion
        // Could be enhanced with specific milestones
        return this.history.length * 5; 
    }
}
