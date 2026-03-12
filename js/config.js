// Game configuration constants
export const CONFIG = {
    // Canvas
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 120, // where underground starts

    // Timing
    ROUND_DURATION: 60,
    PHASE_BRIGHT_END: 15,
    PHASE_DIM_END: 30,
    PHASE_DARK_END: 50,
    // 50-60 is pulse phase

    // Hook
    HOOK_ORIGIN_X: 450,
    HOOK_ORIGIN_Y: 100,
    HOOK_SWING_SPEED: 2,
    HOOK_SWING_MAX_ANGLE: Math.PI * 0.45,
    HOOK_FIRE_SPEED: 400,
    HOOK_RETRACT_BASE_SPEED: 200,
    HOOK_LENGTH: 20,

    // Item types
    ITEMS: {
        smallGold: { name: '小金块', points: 10, weight: 1, radius: 15, color: '#FFD700', glowColor: '#FFD700', glowType: 'blink', glowOnRate: 0.2, glowOffRate: 0.2 },
        medGold: { name: '中金块', points: 30, weight: 2, radius: 22, color: '#FFC125', glowColor: '#FFC125', glowType: 'blink', glowOnRate: 0.3, glowOffRate: 0.3 },
        largeGold: { name: '大金块', points: 100, weight: 4, radius: 32, color: '#DAA520', glowColor: '#DAA520', glowType: 'breathe', glowSpeed: 1.0 },
        diamond: { name: '钻石', points: 500, weight: 1, radius: 14, color: '#E0FFFF', glowColor: '#FFFFFF', glowType: 'pulse5', glowOnRate: 0.1, glowOffRate: 0.1 },
        sandGold: { name: '沙金', points: -50, weight: 1, radius: 16, color: '#B8860B', glowColor: '#8B7500', glowType: 'irregular' },
        rock: { name: '石头', points: 0, weight: 5, radius: 28, color: '#696969', glowColor: null, glowType: 'none' },
        creature: { name: '小动物', points: 20, weight: 1, radius: 16, color: '#FFB6C1', glowColor: '#FFE4E1', glowType: 'moving', moveSpeed: 40 },
        bag: { name: '布袋', points: 0, weight: 1, radius: 18, color: '#8B4513', glowColor: '#FF69B4', glowType: 'rotate' },
    },

    // Powerups
    POWERUP_MAX: 3,
    POWERUP_TYPES: ['nightVision', 'stethoscope', 'flashBomb', 'amulet', 'echo', 'luckyCoin'],
    POWERUP_DURATION: {
        nightVision: 8,
        stethoscope: 8,
        flashBomb: 2, // flash, then 5s deeper dark
        flashBombDarkPenalty: 5,
        amulet: Infinity, // until used
        echo: 0, // instant
        luckyCoin: 5,
    },

    // Difficulty
    BASE_TARGET_SCORE: 300,
    TARGET_SCORE_INCREMENT: 200,

    // Fail tolerance
    MAX_MISTAKES: 3,
    MISTAKE_PENALTY_MULTIPLIER: 2,
    CONSECUTIVE_SUCCESS_TO_CLEAR: 3,

    // Adaptive difficulty
    ADAPTIVE_DARK_DELAY: 2, // seconds delay if struggling
    ADAPTIVE_FLASH_REDUCTION: 0.9, // flash freq multiplier if doing well

    // Expert mode
    EXPERT_UNLOCK_STREAK: 5,
    EXPERT_SCORE_BONUS: 1.2,
    EXPERT_FLASH_REDUCTION: 0.6,
};
