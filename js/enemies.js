// Enemy types and spawning
import { CONFIG } from './config.js';

export class Enemy {
    constructor(type, x, y) {
        const cfg = CONFIG.ENEMIES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = cfg.hp;
        this.maxHp = cfg.hp;
        this.baseSpeed = cfg.speed;
        this.speed = cfg.speed;
        this.points = cfg.points;
        this.dropRate = cfg.dropRate;
        this.radius = cfg.radius;
        this.particleColor = cfg.particleColor;
        this.alive = true;
        this.illuminated = false;
        this.illuminateTimer = 0;
        this.spawnFlash = 0.4; // flash on spawn
        // Bomber state
        this.bomberActive = false;
        this.beepTimer = 0;
        this.beepInterval = CONFIG.BOMBER_BEEP_INTERVAL_START;
        // Movement target
        this.targetX = CONFIG.TURRET_X;
        this.targetY = CONFIG.TURRET_Y;
        // Slight horizontal wander
        this.wanderOffset = (Math.random() - 0.5) * 60;
        this.wanderTimer = Math.random() * Math.PI * 2;
    }

    distToTurret() {
        return CONFIG.TURRET_Y - this.y; // vertical distance
    }

    distToTurretFull() {
        return Math.hypot(this.x - CONFIG.TURRET_X, this.y - CONFIG.TURRET_Y);
    }

    getRadarColor() {
        if (this.type === 'stealth') return '#00FF00'; // always green diamond
        const d = this.distToTurret();
        if (d > CONFIG.DIST_SAFE) return '#00FF00';
        if (d > CONFIG.DIST_WARN) return '#FFDD00';
        return '#FF3333';
    }

    getRadarZone() {
        const d = this.distToTurret();
        if (d > CONFIG.DIST_SAFE) return 'safe';
        if (d > CONFIG.DIST_WARN) return 'warn';
        return 'danger';
    }

    update(dt, speedMult) {
        if (!this.alive) return;

        this.spawnFlash = Math.max(0, this.spawnFlash - dt);

        // Illumination timer
        if (this.illuminateTimer > 0) {
            this.illuminateTimer -= dt;
            this.illuminated = this.illuminateTimer > 0;
        }

        // Movement toward turret with wander
        this.wanderTimer += dt * 1.5;
        const wander = Math.sin(this.wanderTimer) * this.wanderOffset;
        const tx = CONFIG.TURRET_X + wander;
        const ty = CONFIG.TURRET_Y;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        let currentSpeed = this.speed * speedMult;

        // Bomber acceleration in red zone
        if (this.type === 'bomber' && this.distToTurret() <= CONFIG.DIST_WARN) {
            this.bomberActive = true;
            currentSpeed = CONFIG.BOMBER_ACCEL_SPEED * speedMult;
            // Beep timer
            const closeness = 1 - Math.max(0, this.distToTurret()) / CONFIG.DIST_WARN;
            this.beepInterval = CONFIG.BOMBER_BEEP_INTERVAL_START -
                closeness * (CONFIG.BOMBER_BEEP_INTERVAL_START - CONFIG.BOMBER_BEEP_INTERVAL_MIN);
        }

        if (dist > 2) {
            this.x += (dx / dist) * currentSpeed * dt;
            this.y += (dy / dist) * currentSpeed * dt;
        }
    }

    hit() {
        this.hp--;
        this.illuminateTimer = 0.3; // brief flash on hit
        this.illuminated = true;
        if (this.hp <= 0) {
            this.alive = false;
            return true; // killed
        }
        return false; // still alive
    }

    illuminate() {
        this.illuminated = true;
        this.illuminateTimer = CONFIG.ILLUMINATE_DURATION;
    }

    reachedBase() {
        return this.distToTurretFull() < CONFIG.TURRET_RADIUS + this.radius;
    }

    // Draw enemy (only when visible)
    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        switch (this.type) {
            case 'normal':
                ctx.fillStyle = '#CC4444';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(-4, -3, 2.5, 0, Math.PI * 2);
                ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-4, -3, 1.2, 0, Math.PI * 2);
                ctx.arc(4, -3, 1.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'fast':
                ctx.fillStyle = '#4488FF';
                ctx.beginPath();
                // Pointed/aerodynamic shape
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius * 0.8, this.radius * 0.6);
                ctx.lineTo(-this.radius * 0.8, this.radius * 0.6);
                ctx.closePath();
                ctx.fill();
                // Speed lines
                ctx.strokeStyle = 'rgba(68,136,255,0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-this.radius, this.radius);
                ctx.lineTo(-this.radius - 6, this.radius + 8);
                ctx.moveTo(this.radius, this.radius);
                ctx.lineTo(this.radius + 6, this.radius + 8);
                ctx.stroke();
                break;

            case 'heavy':
                ctx.fillStyle = '#FF8800';
                ctx.strokeStyle = '#AA5500';
                ctx.lineWidth = 3;
                // Big square-ish
                const r = this.radius;
                ctx.beginPath();
                ctx.moveTo(-r * 0.8, -r * 0.8);
                ctx.lineTo(r * 0.8, -r * 0.8);
                ctx.lineTo(r * 0.9, r * 0.9);
                ctx.lineTo(-r * 0.9, r * 0.9);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // HP indicator
                if (this.hp < this.maxHp) {
                    ctx.fillStyle = '#FF0';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${this.hp}`, 0, 0);
                }
                break;

            case 'stealth':
                // Translucent ghost-like
                ctx.fillStyle = 'rgba(180,180,180,0.6)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(200,200,200,0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                break;

            case 'bomber':
                ctx.fillStyle = this.bomberActive ? '#FF2222' : '#CC4444';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                if (this.bomberActive) {
                    // Flashing warning
                    ctx.strokeStyle = `rgba(255,0,0,${0.5 + 0.5 * Math.sin(Date.now() * 0.02)})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
                // Fuse on top
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(0, -this.radius - 6);
                ctx.stroke();
                // Spark
                ctx.fillStyle = '#FF0';
                ctx.beginPath();
                ctx.arc(0, -this.radius - 6, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    // Draw as red silhouette (illuminated in dark)
    drawSilhouette(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(255,50,50,0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,100,100,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Draw night vision outline
    drawNightVision(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = 'rgba(0,255,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Scripted timeline events (time in seconds)
const TIMELINE = [
    { t: 13,  type: 'small',   enemies: ['normal'] },
    { t: 25,  type: 'typed',   enemies: ['fast'], count: 3 },
    { t: 50,  type: 'medium',  enemies: ['normal', 'fast'] },
    // 65-70: rest (no spawns)
    { t: 71,  type: 'mixed',   enemies: ['heavy', 'normal'], counts: { heavy: 2, normal: 3 } },
    { t: 97,  type: 'typed',   enemies: ['stealth'], count: 3 },
    { t: 110, type: 'medium',  enemies: ['normal', 'fast', 'heavy'] },
    { t: 123, type: 'small',   enemies: ['normal', 'fast'] },
    { t: 136, type: 'small',   enemies: ['normal', 'fast'] },
    { t: 150, type: 'medium',  enemies: ['normal', 'fast', 'heavy', 'stealth'] },
    { t: 161, type: 'typed',   enemies: ['bomber'], count: 2, bright: true },
    { t: 175, type: 'typed',   enemies: ['bomber'], count: 2 },
    { t: 180, type: 'small',   enemies: ['normal', 'fast'] },
    // 188-194: rest
    { t: 202, type: 'medium',  enemies: ['normal', 'fast', 'heavy', 'stealth'] },
    { t: 220, type: 'large',   enemies: ['normal', 'fast', 'heavy', 'stealth', 'bomber'] },
];

// Rest periods (no random spawns)
const REST_PERIODS = [
    { start: 65, end: 70 },
    { start: 188, end: 194 },
];

// Wave sizes
const WAVE_SIZES = { small: [3, 4], medium: [5, 7], large: [10, 15] };

// Spawn manager - scripted timeline + background trickle
export class WaveSpawner {
    constructor() {
        this.reset();
    }

    reset() {
        this.trickleTimer = 0;
        this.trickleInterval = 2.5;
        this.firedEvents = new Set();
        this.introducedTypes = new Set(['normal']); // types available for random trickle
        this.brightOverride = 0; // seconds remaining for forced bright
    }

    update(dt, elapsed, enemies) {
        // Update bright override
        if (this.brightOverride > 0) this.brightOverride = Math.max(0, this.brightOverride - dt);

        // Fire scripted events
        for (let i = 0; i < TIMELINE.length; i++) {
            const evt = TIMELINE[i];
            if (elapsed >= evt.t && !this.firedEvents.has(i)) {
                this.firedEvents.add(i);
                // Register introduced types
                for (const t of evt.enemies) this.introducedTypes.add(t);
                // Trigger bright override
                if (evt.bright) this.brightOverride = 14; // 2:41 -> bright until ~2:55
                // Spawn wave
                this._spawnWave(evt, enemies);
            }
        }

        // Check rest periods
        const inRest = REST_PERIODS.some(r => elapsed >= r.start && elapsed <= r.end);
        if (inRest) return;

        // Background trickle spawns
        this.trickleTimer += dt;
        // Gradually speed up trickle
        this.trickleInterval = Math.max(1.2, 2.5 - elapsed / 200);
        if (this.trickleTimer >= this.trickleInterval) {
            this.trickleTimer -= this.trickleInterval;
            const types = Array.from(this.introducedTypes);
            const type = types[Math.floor(Math.random() * types.length)];
            enemies.push(new Enemy(type, ...this._randPos()));
        }
    }

    _spawnWave(evt, enemies) {
        let count;
        if (evt.type === 'typed') {
            count = evt.count;
        } else if (evt.type === 'mixed') {
            // Specific counts per type
            for (const [t, c] of Object.entries(evt.counts)) {
                for (let i = 0; i < c; i++) {
                    enemies.push(new Enemy(t, ...this._randPos()));
                }
            }
            return;
        } else {
            const [min, max] = WAVE_SIZES[evt.type] || [3, 4];
            count = min + Math.floor(Math.random() * (max - min + 1));
        }
        for (let i = 0; i < count; i++) {
            const type = evt.enemies[Math.floor(Math.random() * evt.enemies.length)];
            enemies.push(new Enemy(type, ...this._randPos()));
        }
    }

    _randPos() {
        const side = Math.random();
        if (side < 0.6) {
            return [40 + Math.random() * (CONFIG.CANVAS_WIDTH - 80), -20];
        } else if (side < 0.8) {
            return [-20, 20 + Math.random() * (CONFIG.CANVAS_HEIGHT * 0.3)];
        } else {
            return [CONFIG.CANVAS_WIDTH + 20, 20 + Math.random() * (CONFIG.CANVAS_HEIGHT * 0.3)];
        }
    }

    isBrightOverride() {
        return this.brightOverride > 0;
    }
}
