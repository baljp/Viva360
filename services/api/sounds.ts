// ─── services/api/sounds.ts ────────────────────────────────────────────────────
// Enterprise Sound Design Layer (Immersive UX 10/10)
// ─────────────────────────────────────────────────────────────────────────────

class SoundManager {
    private audioContext: AudioContext | null = null;

    private async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Synthesizes a premium "Zen" notification sound
     */
    async play(type: 'success' | 'alert' | 'transition' | 'pulse') {
        try {
            await this.init();
            if (!this.audioContext) return;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            const now = this.audioContext.currentTime;

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'pulse') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'transition') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.linearRampToValueAtTime(440, now + 0.2);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            console.debug('[SOUND] Audio context blocked or unavailable', e);
        }
    }
}

export const sounds = new SoundManager();
