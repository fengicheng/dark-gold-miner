// Powerup system
import { CONFIG } from './config.js';

export const PowerupType = {
    NIGHT_VISION: 'nightVision',
    STETHOSCOPE: 'stethoscope',
    FLASH_BOMB: 'flashBomb',
    AMULET: 'amulet',
    ECHO: 'echo',
    LUCKY_COIN: 'luckyCoin',
};

const POWERUP_INFO = {
    nightVision: { name: '夜视镜', icon: '🔭', color: '#00FF00' },
    stethoscope: { name: '听诊器', icon: '🩺', color: '#4169E1' },
    flashBomb: { name: '闪光弹', icon: '💡', color: '#FFFF00' },
    amulet: { name: '护身符', icon: '🛡️', color: '#FF6347' },
    echo: { name: '回声器', icon: '📡', color: '#9370DB' },
    luckyCoin: { name: '幸运币', icon: '🍀', color: '#32CD32' },
};

export class PowerupManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.inventory = []; // max 3
        this.active = null; // { type, remaining }
        this.flashOverride = 0; // > 0 means full bright
        this.flashDarkPenalty = 0; // > 0 means extra dark
        this.hasAmulet = false;
        this.luckyCoinActive = false;
        this.echoPoints = []; // {x, y, radius, alpha}
    }

    addRandom() {
        if (this.inventory.length >= CONFIG.POWERUP_MAX) return null;
        const types = CONFIG.POWERUP_TYPES;
        // Don't add duplicate
        const available = types.filter(t => !this.inventory.includes(t) && !(this.active && this.active.type === t));
        if (available.length === 0) return null;
        const type = available[Math.floor(Math.random() * available.length)];
        this.inventory.push(type);
        return type;
    }

    use(index, items) {
        if (index < 0 || index >= this.inventory.length) return false;
        const type = this.inventory[index];
        this.inventory.splice(index, 1);

        switch (type) {
            case PowerupType.NIGHT_VISION:
            case PowerupType.STETHOSCOPE:
            case PowerupType.LUCKY_COIN:
                this.active = { type, remaining: CONFIG.POWERUP_DURATION[type] };
                if (type === PowerupType.LUCKY_COIN) this.luckyCoinActive = true;
                break;
            case PowerupType.FLASH_BOMB:
                this.flashOverride = CONFIG.POWERUP_DURATION.flashBomb;
                this.flashDarkPenalty = 0;
                break;
            case PowerupType.AMULET:
                this.hasAmulet = true;
                break;
            case PowerupType.ECHO:
                this._doEcho(items);
                break;
        }
        return true;
    }

    // Auto-use powerups that trigger on pickup
    autoActivate(type, items) {
        switch (type) {
            case PowerupType.NIGHT_VISION:
            case PowerupType.STETHOSCOPE:
            case PowerupType.LUCKY_COIN:
                this.active = { type, remaining: CONFIG.POWERUP_DURATION[type] };
                if (type === PowerupType.LUCKY_COIN) this.luckyCoinActive = true;
                break;
            case PowerupType.AMULET:
                this.hasAmulet = true;
                break;
            case PowerupType.FLASH_BOMB:
                this.inventory.push(type); // manual use only
                break;
            case PowerupType.ECHO:
                this.inventory.push(type); // manual use only
                break;
        }
    }

    _doEcho(items) {
        this.echoPoints = [];
        if (!items) return;
        for (const item of items) {
            if (!item.alive) continue;
            if (item.points > 0) {
                this.echoPoints.push({ x: item.x, y: item.y, radius: 5, alpha: 1, maxRadius: 30 });
            }
        }
    }

    update(dt) {
        // Active powerup timer
        if (this.active && this.active.remaining !== Infinity) {
            this.active.remaining -= dt;
            if (this.active.remaining <= 0) {
                if (this.active.type === PowerupType.LUCKY_COIN) this.luckyCoinActive = false;
                this.active = null;
            }
        }

        // Flash override
        if (this.flashOverride > 0) {
            this.flashOverride -= dt;
            if (this.flashOverride <= 0) {
                this.flashOverride = 0;
                this.flashDarkPenalty = CONFIG.POWERUP_DURATION.flashBombDarkPenalty;
            }
        }
        if (this.flashDarkPenalty > 0) {
            this.flashDarkPenalty -= dt;
            if (this.flashDarkPenalty <= 0) this.flashDarkPenalty = 0;
        }

        // Echo animation
        for (const p of this.echoPoints) {
            p.radius += dt * 60;
            p.alpha = Math.max(0, 1 - p.radius / p.maxRadius);
        }
        this.echoPoints = this.echoPoints.filter(p => p.alpha > 0);
    }

    getDarknessModifier() {
        if (this.flashOverride > 0) return -1; // full bright
        if (this.flashDarkPenalty > 0) return 0.15; // extra dark
        if (this.active && this.active.type === PowerupType.NIGHT_VISION) return -0.7; // reduce darkness
        return 0;
    }

    isStethoscopeActive() {
        return this.active && this.active.type === PowerupType.STETHOSCOPE;
    }

    getInfo(type) {
        return POWERUP_INFO[type] || {};
    }

    drawInventory(ctx, canvasWidth, canvasHeight) {
        const y = canvasHeight - 45;
        const startX = canvasWidth / 2 - this.inventory.length * 30;

        for (let i = 0; i < this.inventory.length; i++) {
            const type = this.inventory[i];
            const info = POWERUP_INFO[type];
            const x = startX + i * 60;

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.strokeStyle = info.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - 22, y - 22, 44, 44, 8);
            ctx.fill();
            ctx.stroke();

            // Icon
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFF';
            ctx.fillText(info.icon, x, y);

            // Key hint
            ctx.font = '10px Arial';
            ctx.fillStyle = '#AAA';
            ctx.fillText(`${i + 1}`, x, y + 28);
        }
    }

    drawEcho(ctx) {
        for (const p of this.echoPoints) {
            ctx.strokeStyle = `rgba(147,112,219,${p.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
