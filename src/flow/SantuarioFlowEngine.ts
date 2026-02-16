
import { SantuarioState, santuarioTransitions } from './santuarioTypes';

export class SantuarioFlowEngine {
    public currentState: SantuarioState;
    public history: SantuarioState[];

    constructor(initialState: SantuarioState = 'START', initialHistory: SantuarioState[] = []) {
        this.currentState = initialState;
        this.history = initialHistory;
    }

    public getState(): SantuarioState {
        return this.currentState;
    }

    public canTransitionTo(target: SantuarioState): boolean {
        const allowed = santuarioTransitions[this.currentState];
        return allowed?.includes(target) ?? false;
    }

    public transition(target: SantuarioState): boolean {
        if (!this.canTransitionTo(target)) {
            console.warn(`[SantuarioFlow] Invalid transition blocked: ${this.currentState} -> ${target}`);
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
}
