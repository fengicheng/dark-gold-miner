// Light phase controller
import { CONFIG } from './config.js';

export const Phase = {
    BRIGHT: 'bright',
    DIM: 'dim',
    DARK: 'dark',
    PULSE: 'pulse',
};

export class PhaseController {
    constructor() {
        this.reset();
    }

    reset() {
        this.current = Phase.BRIGHT;
        this.darknessAlpha = 0;
        this.adaptiveDelay = 0; // seconds to delay darkness
    }

    update(elapsed) {
        const t = elapsed;
        const brightEnd = CONFIG.PHASE_BRIGHT_END + this.adaptiveDelay;
        const dimEnd = CONFIG.PHASE_DIM_END + this.adaptiveDelay;
        const darkEnd = CONFIG.PHASE_DARK_END;

        if (t < brightEnd) {
            this.current = Phase.BRIGHT;
            this.darknessAlpha = 0;
        } else if (t < dimEnd) {
            this.current = Phase.DIM;
            const progress = (t - brightEnd) / (dimEnd - brightEnd);
            this.darknessAlpha = progress * 0.92;
        } else if (t < darkEnd) {
            this.current = Phase.DARK;
            this.darknessAlpha = 0.92;
        } else {
            this.current = Phase.PULSE;
            this.darknessAlpha = 0.92;
        }
    }

    isDark() {
        return this.current === Phase.DARK || this.current === Phase.PULSE;
    }

    isDimOrDarker() {
        return this.current !== Phase.BRIGHT;
    }

    getPulseIntensity(elapsed) {
        if (this.current !== Phase.PULSE) return 1;
        // Accelerating pulse in final 10 seconds
        const t = elapsed - CONFIG.PHASE_DARK_END;
        const freq = 2 + t * 0.5; // increasing frequency
        return 0.7 + 0.3 * Math.sin(t * freq * Math.PI * 2);
    }
}
