// Powerup system - Dark Domain Defense
import { CONFIG } from './config.js';

const POWERUP_INFO = {
    flare:      { name: '照明弹', icon: '🔦', color: '#FFFF00' },
    radarBoost: { name: '雷达增强', icon: '📡', color: '#00FF00' },
    rapidFire:  { name: '快速装填', icon: '⚡', color: '#FF8800' },
    shield:     { name: '护盾', icon: '🛡️', color: '#4488FF' },
    sonar:      { name: '声呐', icon: '🔊', color: '#9370DB' },
    nightVision:{ name: '夜视仪', icon: '👁️', color: '#00FF88' },
};

export class PowerupManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.inventory = [];
        this.activeEffects = {};
        this.hasShield = false;
        this.sonarCooldown = 0;
        this.sonarWaves = [];
        this.pendingDrops = [];
        this.flareAlpha = 0;
    }

    tryDrop(x, y, dropRate) {
        if (Math.random() > dropRate) return;
        if (this.inventory.length >= CONFIG.POWERUP_MAX && this.pendingDrops.length === 0) return;
        const available = CONFIG.POWERUP_TYPES.filter(t => !this.inventory.includes(t));
        if (available.length === 0) return;
        const type = available[Math.floor(Math.random() * available.length)];
        this.pendingDrops.push({ type, x, y, vy: 0, timer: 5 });
    }

    update(dt) {
        for (const type of Object.keys(this.activeEffects)) {
            if (this.activeEffects[type] !== Infinity) {
                this.activeEffects[type] -= dt;
                if (this.activeEffects[type] <= 0) delete this.activeEffects[type];
            }
        }
        if (this.sonarCooldown > 0) this.sonarCooldown -= dt;
        for (const w of this.sonarWaves) {
            w.radius += dt * 300;
            w.alpha = Math.max(0, 1 - w.radius / 400);
        }
        this.sonarWaves = this.sonarWaves.filter(w => w.alpha > 0);
        if (this.flareAlpha > 0) this.flareAlpha -= dt * 0.5;

        for (const drop of this.pendingDrops) {
            drop.vy += 200 * dt;
            drop.y += drop.vy * dt;
            drop.timer -= dt;
            if (drop.y >= CONFIG.CANVAS_HEIGHT - 60 || drop.timer <= 0) {
                if (this.inventory.length < CONFIG.POWERUP_MAX) {
                    this.inventory.push(drop.type);
                    this._autoActivate(drop.type);
                    drop.timer = -1;
                } else if (drop.timer <= 0) {
                    drop.timer = -1;
                }
            }
        }
        this.pendingDrops = this.pendingDrops.filter(d => d.timer > -1);
    }

    _autoActivate(type) {
        switch (type) {
            case 'radarBoost':
            case 'rapidFire':
            case 'nightVision':
                this.activeEffects[type] = CONFIG.POWERUP_DURATION[type];
                this.inventory = this.inventory.filter(t => t !== type);
                break;
            case 'shield':
                this.hasShield = true;
                this.inventory = this.inventory.filter(t => t !== type);
                break;
        }
    }

    use(index) {
        if (index < 0 || index >= this.inventory.length) return false;
        const type = this.inventory[index];
        switch (type) {
            case 'flare':
                this.flareAlpha = 1;
                this.activeEffects.flare = CONFIG.POWERUP_DURATION.flare;
                this.inventory.splice(index, 1);
                return true;
            case 'sonar':
                if (this.sonarCooldown > 0) return false;
                this.sonarWaves.push({ x: CONFIG.TURRET_X, y: CONFIG.TURRET_Y, radius: 10, alpha: 1 });
                this.activeEffects.sonar = CONFIG.POWERUP_DURATION.sonar;
                this.sonarCooldown = CONFIG.SONAR_COOLDOWN;
                this.inventory.splice(index, 1);
                return true;
            default:
                return false;
        }
    }

    isFlareActive() { return (this.activeEffects.flare || 0) > 0; }
    isRadarBoostActive() { return (this.activeEffects.radarBoost || 0) > 0; }
    isRapidFireActive() { return (this.activeEffects.rapidFire || 0) > 0; }
    isNightVisionActive() { return (this.activeEffects.nightVision || 0) > 0; }
    isSonarActive() { return (this.activeEffects.sonar || 0) > 0; }

    useShield() {
        if (this.hasShield) { this.hasShield = false; return true; }
        return false;
    }

    getInfo(type) { return POWERUP_INFO[type] || {}; }

    drawInventory(ctx) {
        const H = CONFIG.CANVAS_HEIGHT;
        const y = H - 30;
        for (let i = 0; i < this.inventory.length; i++) {
            const type = this.inventory[i];
            const info = POWERUP_INFO[type];
            const side = i < 2 ? -1 : 1;
            const idx = i < 2 ? i : i - 2;
            const x = CONFIG.TURRET_X + side * (60 + idx * 50);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.strokeStyle = info.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFF';
            ctx.fillText(info.icon, x, y);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#AAA';
            ctx.fillText(`${i + 1}`, x, y + 16);
        }
        if (this.hasShield) {
            ctx.strokeStyle = 'rgba(68,136,255,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(CONFIG.TURRET_X, CONFIG.TURRET_Y, CONFIG.TURRET_RADIUS + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawDrops(ctx) {
        for (const drop of this.pendingDrops) {
            const info = POWERUP_INFO[drop.type];
            ctx.save();
            ctx.translate(drop.x, drop.y);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
            gradient.addColorStop(0, info.color + '88');
            gradient.addColorStop(1, info.color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(info.icon, 0, 0);
            ctx.restore();
        }
    }

    drawSonarWaves(ctx) {
        for (const w of this.sonarWaves) {
            ctx.strokeStyle = `rgba(147,112,219,${w.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
