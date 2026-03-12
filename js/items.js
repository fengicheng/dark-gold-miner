// Item classes and spawning
import { CONFIG } from './config.js';

export class Item {
    constructor(type, x, y) {
        const cfg = CONFIG.ITEMS[type];
        this.type = type;
        this.cfg = cfg;
        this.x = x;
        this.y = y;
        this.radius = cfg.radius;
        this.points = cfg.points;
        this.weight = cfg.weight;
        this.alive = true;
        this.glowTimer = Math.random() * 10; // offset for variety
        this.glowVisible = false;
        // For creatures
        this.moveDir = Math.random() > 0.5 ? 1 : -1;
        this.moveSpeed = cfg.moveSpeed || 0;
        this.minX = 40;
        this.maxX = CONFIG.CANVAS_WIDTH - 40;
        // For bag rotation glow
        this.rotAngle = 0;
    }

    update(dt) {
        this.glowTimer += dt;
        // Creature movement
        if (this.type === 'creature' && this.alive) {
            this.x += this.moveDir * this.moveSpeed * dt;
            if (this.x < this.minX || this.x > this.maxX) {
                this.moveDir *= -1;
                this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
            }
        }
        // Bag rotation
        if (this.type === 'bag') {
            this.rotAngle += dt * 1.5;
        }
        // Update glow visibility
        this.glowVisible = this._calcGlow();
    }

    _calcGlow() {
        const t = this.glowTimer;
        const cfg = this.cfg;
        switch (cfg.glowType) {
            case 'blink': {
                const period = cfg.glowOnRate + cfg.glowOffRate;
                return (t % period) < cfg.glowOnRate;
            }
            case 'breathe': {
                const speed = cfg.glowSpeed || 1;
                return Math.sin(t * Math.PI / speed) > 0;
            }
            case 'pulse5': {
                // 5 rapid pulses then pause
                const period = cfg.glowOnRate + cfg.glowOffRate;
                const cycleTime = period * 5 + 1.0; // 5 pulses + 1s pause
                const inCycle = t % cycleTime;
                if (inCycle > period * 5) return false;
                return (inCycle % period) < cfg.glowOnRate;
            }
            case 'irregular': {
                // Random-ish, dim
                return Math.sin(t * 3.7) > 0.6 || Math.sin(t * 7.1) > 0.8;
            }
            case 'moving':
                return true; // always glow for creatures
            case 'rotate':
                return Math.sin(t * 2) > -0.3; // mostly on
            case 'none':
            default:
                return false;
        }
    }

    getGlowIntensity() {
        const t = this.glowTimer;
        const cfg = this.cfg;
        if (cfg.glowType === 'breathe') {
            const speed = cfg.glowSpeed || 1;
            return Math.max(0, Math.sin(t * Math.PI / speed));
        }
        if (cfg.glowType === 'irregular') {
            return 0.3 + Math.sin(t * 3.7) * 0.15;
        }
        return this.glowVisible ? 1 : 0;
    }

    draw(ctx, darknessAlpha, pulseIntensity) {
        if (!this.alive) return;

        const inDark = darknessAlpha > 0.5;

        if (!inDark) {
            this._drawFull(ctx);
        }
    }

    _drawFull(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        switch (this.type) {
            case 'smallGold':
            case 'medGold':
            case 'largeGold':
                this._drawGold(ctx);
                break;
            case 'diamond':
                this._drawDiamond(ctx);
                break;
            case 'sandGold':
                this._drawSandGold(ctx);
                break;
            case 'rock':
                this._drawRock(ctx);
                break;
            case 'creature':
                this._drawCreature(ctx);
                break;
            case 'bag':
                this._drawBag(ctx);
                break;
        }
        ctx.restore();
    }

    drawGlow(ctx, pulseIntensity) {
        if (!this.alive || !this.glowVisible) return;
        if (!this.cfg.glowColor) return;

        const intensity = this.getGlowIntensity() * pulseIntensity;
        if (intensity <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const glowRadius = this.radius * (1.5 + intensity * 0.5);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.cfg.glowColor + Math.floor(intensity * 200).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, this.cfg.glowColor + Math.floor(intensity * 80).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.cfg.glowColor + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Small core
        ctx.fillStyle = this.cfg.glowColor;
        ctx.globalAlpha = intensity * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawGold(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.cfg.color;
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        // Rounded rectangle shape
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.5);
        ctx.lineTo(r * 0.7, -r * 0.5);
        ctx.lineTo(r * 0.9, r * 0.5);
        ctx.lineTo(-r * 0.9, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.2, -r * 0.2, r * 0.2, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawDiamond(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.cfg.color;
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.7, -r * 0.2);
        ctx.lineTo(r * 0.5, r);
        ctx.lineTo(-r * 0.5, r);
        ctx.lineTo(-r * 0.7, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Sparkle
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSandGold(ctx) {
        // Looks similar to gold but duller
        const r = this.radius;
        ctx.fillStyle = this.cfg.color;
        ctx.strokeStyle = '#6B4E0A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.4);
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.lineTo(r * 0.8, r * 0.4);
        ctx.lineTo(-r * 0.7, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    _drawRock(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.cfg.color;
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.7);
        ctx.lineTo(r * 0.4, -r * 0.8);
        ctx.lineTo(r * 0.8, -r * 0.2);
        ctx.lineTo(r * 0.6, r * 0.6);
        ctx.lineTo(-r * 0.3, r * 0.7);
        ctx.lineTo(-r * 0.8, r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    _drawCreature(ctx) {
        const r = this.radius;
        // Body
        ctx.fillStyle = this.cfg.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.2, 2, 0, Math.PI * 2);
        ctx.arc(r * 0.3, -r * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBag(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.cfg.color;
        ctx.strokeStyle = '#5C3317';
        ctx.lineWidth = 2;
        // Bag shape
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI, true);
        ctx.lineTo(-r * 0.3, -r * 0.6);
        ctx.quadraticCurveTo(0, -r * 0.9, r * 0.3, -r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Tie
        ctx.strokeStyle = '#3E1A00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.15, -r * 0.5);
        ctx.lineTo(r * 0.15, -r * 0.5);
        ctx.stroke();
        // Question mark
        ctx.fillStyle = '#FFD700';
        ctx.font = `${r * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, r * 0.15);
    }
}

// Generate items for a level
export function generateItems(level) {
    const items = [];
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const topY = CONFIG.GROUND_Y + 40;
    const bottomY = H - 30;

    // Item counts scale with level
    const counts = {
        smallGold: Math.max(2, 5 - Math.floor(level / 3)),
        medGold: 3,
        largeGold: Math.min(3, 1 + Math.floor(level / 2)),
        diamond: level >= 2 ? 1 : 0,
        sandGold: Math.min(4, 1 + Math.floor(level / 2)),
        rock: Math.min(5, 2 + Math.floor(level / 2)),
        creature: level >= 2 ? 1 : 0,
        bag: level >= 1 ? 1 : 0,
    };

    const placed = [];

    function tryPlace(type) {
        const cfg = CONFIG.ITEMS[type];
        for (let attempt = 0; attempt < 30; attempt++) {
            const x = 50 + Math.random() * (W - 100);
            const y = topY + Math.random() * (bottomY - topY);
            // Check overlap
            const overlap = placed.some(p =>
                Math.hypot(p.x - x, p.y - y) < (p.radius + cfg.radius + 10)
            );
            if (!overlap) {
                const item = new Item(type, x, y);
                items.push(item);
                placed.push({ x, y, radius: cfg.radius });
                return;
            }
        }
    }

    for (const [type, count] of Object.entries(counts)) {
        for (let i = 0; i < count; i++) {
            tryPlace(type);
        }
    }

    return items;
}
