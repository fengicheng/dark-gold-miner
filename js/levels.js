// Level definitions and difficulty scaling
import { CONFIG } from './config.js';

export function getTargetScore(level) {
    return CONFIG.BASE_TARGET_SCORE + (level - 1) * CONFIG.TARGET_SCORE_INCREMENT;
}

export function getLevelConfig(level) {
    return {
        targetScore: getTargetScore(level),
        hookSwingSpeed: CONFIG.HOOK_SWING_SPEED + (level - 1) * 0.15,
        // Phase timing adjustments per level (not used yet, keep for future)
    };
}
