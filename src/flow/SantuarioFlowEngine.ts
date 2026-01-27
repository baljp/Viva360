
import { SantuarioState, santuarioTransitions } from './santuarioTypes';

export class SantuarioFlowEngine {
    private currentState: SantuarioState;
    private history: SantuarioState[];

    constructor(initialState: SantuarioState = 'START') {
        this.currentState = initialState;
        this.history = [];
    }

    public getState(): SantuarioState {
        return this.currentState;
    }

    public canTransitionTo(target: SantuarioState): boolean {
        const allowed = santuarioTransitions[this.currentState];
        return allowed?.includes(target) ?? false;
    }

    public transition(target: SantuarioState): boolean {
        if (this.canTransitionTo(target)) {
            this.history.push(this.currentState);
            this.currentState = target;
            return true;
        }
        console.warn(`[SantuarioFlow] Invalid transition: ${this.currentState} -> ${target}`);
        return false;
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
