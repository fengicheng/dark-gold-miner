// Level definitions
import { CONFIG } from './config.js';

export function getTargetScore(level) {
    return CONFIG.BASE_TARGET_SCORE + (level - 1) * CONFIG.TARGET_SCORE_INCREMENT;
}
