
import { GuardiaoState, guardiaoTransitions } from './guardiaoTypes';

export class GuardiaoFlowEngine {
    private currentState: GuardiaoState;
    private history: GuardiaoState[];

    constructor(initialState: GuardiaoState = 'START') {
        this.currentState = initialState;
        this.history = [];
    }

    public getState(): GuardiaoState {
        return this.currentState;
    }

    public canTransitionTo(target: GuardiaoState): boolean {
        const allowed = guardiaoTransitions[this.currentState];
        return allowed?.includes(target) ?? false;
    }

    public transition(target: GuardiaoState): boolean {
        // Auto-allow backing to previous state logic could be added, but strict map is safer
        if (this.canTransitionTo(target)) {
            this.history.push(this.currentState);
            this.currentState = target;
            return true;
        }
        console.warn(`[GuardiaoFlow] Invalid transition: ${this.currentState} -> ${target}`);
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
