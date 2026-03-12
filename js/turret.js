// Turret and bullet system
import { CONFIG } from './config.js';

export class Bullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.alive = true;
        this.trail = []; // for visual trail
    }

    update(dt) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.dx * CONFIG.BULLET_SPEED * dt;
        this.y += this.dy * CONFIG.BULLET_SPEED * dt;

        // Out of bounds
        if (this.x < -10 || this.x > CONFIG.CANVAS_WIDTH + 10 ||
            this.y < -10 || this.y > CONFIG.CANVAS_HEIGHT + 10) {
            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = `rgba(255,255,150,${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Bullet
        ctx.fillStyle = '#FFF';
        ctx.shadowColor = '#FF8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, CONFIG.BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class Turret {
    constructor() {
        this.x = CONFIG.TURRET_X;
        this.y = CONFIG.TURRET_Y;
        this.angle = -Math.PI / 2; // pointing up
        this.fireCooldown = 0;
        this.fireRateMultiplier = 1;
    }

    reset() {
        this.fireCooldown = 0;
        this.fireRateMultiplier = 1;
    }

    update(dt, mouseX, mouseY) {
        // Aim toward mouse
        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
        // Cooldown
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
    }

    canFire() {
        return this.fireCooldown <= 0;
    }

    fire(mouseX, mouseY) {
        if (!this.canFire()) return null;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const len = Math.hypot(dx, dy);
        if (len < 5) return null;

        this.fireCooldown = 1 / (CONFIG.FIRE_RATE * this.fireRateMultiplier);

        // Spawn bullet slightly ahead of turret
        const nx = dx / len;
        const ny = dy / len;
        return new Bullet(
            this.x + nx * 20,
            this.y + ny * 20,
            nx, ny
        );
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base
        ctx.fillStyle = '#445';
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.TURRET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#667';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.TURRET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();

        // Barrel
        ctx.rotate(this.angle);
        ctx.fillStyle = '#778';
        ctx.fillRect(0, -3, 28, 6);
        ctx.fillStyle = '#99A';
        ctx.fillRect(24, -4, 6, 8);

        ctx.restore();

        // Glow around turret (always visible)
        ctx.save();
        const gradient = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, 35);
        gradient.addColorStop(0, 'rgba(100,150,255,0.15)');
        gradient.addColorStop(1, 'rgba(100,150,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
