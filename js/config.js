// Game configuration - Dark Domain Defense (暗域防线)
export const CONFIG = {
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 600,

    // Turret (bottom center)
    TURRET_X: 450,
    TURRET_Y: 570,
    TURRET_RADIUS: 18,

    // Timing (seconds)
    ROUND_DURATION: 246, // 4:06
    PHASE_BRIGHT_END: 10,
    PHASE_DIM_END: 20,
    PHASE_DARK_END: 40,

    // Shooting
    FIRE_RATE: 5,
    BULLET_SPEED: 800,
    BULLET_RADIUS: 3,
    MAGAZINE_SIZE: 15,
    RELOAD_TIME: 1.2,

    // Kill illumination
    ILLUMINATE_RADIUS: 250,
    ILLUMINATE_DURATION: 0.5,

    // Radar
    RADAR_RADIUS: 75,
    RADAR_SCAN_SPEED: 3,

    // Distance thresholds (pixels, vertical dist to turret)
    DIST_SAFE: 300,
    DIST_WARN: 150,

    // Enemy configs
    ENEMIES: {
        normal:  { hp: 1, speed: 60,  points: 10, dropRate: 0.05, particleColor: '#FFD700', radius: 12 },
        fast:    { hp: 1, speed: 78,  points: 20, dropRate: 0.08, particleColor: '#4488FF', radius: 10 },
        heavy:   { hp: 3, speed: 35,  points: 50, dropRate: 0.15, particleColor: '#FF8800', radius: 18 },
        stealth: { hp: 1, speed: 55,  points: 30, dropRate: 0.10, particleColor: '#AAAAAA', radius: 12 },
        bomber:  { hp: 1, speed: 55,  points: 20, dropRate: 0.05, particleColor: '#FF4444', radius: 12 },
    },

    BOMBER_ACCEL_SPEED: 120,
    BOMBER_BEEP_INTERVAL_START: 0.5,
    BOMBER_BEEP_INTERVAL_MIN: 0.1,

    // Pulse phase
    PULSE_SPEED_MULT: 1.2,

    // Scoring (survival mode, no target)
    BASE_TARGET_SCORE: 500,
    TARGET_SCORE_INCREMENT: 300,

    // Lives
    MAX_LIVES: 10,

    // Powerups
    POWERUP_MAX: 3,
    POWERUP_TYPES: ['flare', 'radarBoost', 'rapidFire', 'shield', 'sonar', 'nightVision'],
    POWERUP_DURATION: {
        flare: 3,
        radarBoost: 10,
        rapidFire: 10,
        shield: Infinity,
        sonar: 1,
        nightVision: 8,
    },
    SONAR_COOLDOWN: 6,
    RAPID_FIRE_MULT: 1.5,

    // Wave spawning
    SPAWN_INTERVAL_BASE: 2.0,
    SPAWN_INTERVAL_MIN: 0.6,
    SPAWN_RAMP_PER_LEVEL: 0.3,
};
