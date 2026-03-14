// Light phase controller
import { CONFIG } from './config.js';

export const Phase = {
    BRIGHT: 'bright',
    DIM: 'dim',
    DARK: 'dark',
    PULSE: 'pulse',
};

// Phase cycle length (repeats throughout the game)
const CYCLE_LENGTH = CONFIG.PHASE_DARK_END + 20; // bright+dim+dark+pulse then repeat

export class PhaseController {
    constructor() {
        this.reset();
    }

    reset() {
        this.current = Phase.BRIGHT;
        this.darknessAlpha = 0;
    }

    update(elapsed, brightOverride = false) {
        if (brightOverride) {
            this.current = Phase.BRIGHT;
            this.darknessAlpha = 0;
            return;
        }

        // Cycle through phases repeatedly
        const t = elapsed % CYCLE_LENGTH;

        if (t < CONFIG.PHASE_BRIGHT_END) {
            this.current = Phase.BRIGHT;
            this.darknessAlpha = 0;
        } else if (t < CONFIG.PHASE_DIM_END) {
            this.current = Phase.DIM;
            const progress = (t - CONFIG.PHASE_BRIGHT_END) / (CONFIG.PHASE_DIM_END - CONFIG.PHASE_BRIGHT_END);
            this.darknessAlpha = progress * 0.93;
        } else if (t < CONFIG.PHASE_DARK_END) {
            this.current = Phase.DARK;
            this.darknessAlpha = 0.93;
        } else {
            this.current = Phase.PULSE;
            this.darknessAlpha = 0.93;
        }
    }

    isDark() {
        return this.current === Phase.DARK || this.current === Phase.PULSE;
    }

    isDimOrDarker() {
        return this.current !== Phase.BRIGHT;
    }

    getSpeedMultiplier() {
        return this.current === Phase.PULSE ? CONFIG.PULSE_SPEED_MULT : 1;
    }
}
