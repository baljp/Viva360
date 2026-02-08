
import { GuardiaoState, guardiaoTransitions } from './guardiaoTypes';

export class GuardiaoFlowEngine {
    public currentState: GuardiaoState;
    public history: GuardiaoState[];

    constructor(initialState: GuardiaoState = 'START', initialHistory: GuardiaoState[] = []) {
        this.currentState = initialState;
        this.history = initialHistory;
    }

    public getState(): GuardiaoState {
        return this.currentState;
    }

    public canTransitionTo(target: GuardiaoState): boolean {
        const allowed = guardiaoTransitions[this.currentState];
        return allowed?.includes(target) ?? false;
    }

    public transition(target: GuardiaoState): boolean {
        if (!this.canTransitionTo(target)) {
            console.warn(`[GuardiaoFlow] Invalid transition (forced): ${this.currentState} -> ${target}`);
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
