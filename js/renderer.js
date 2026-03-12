// Main renderer - handles background, darkness overlay, glow effects
import { CONFIG } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // Offscreen canvas for glow compositing
        this.glowCanvas = document.createElement('canvas');
        this.glowCanvas.width = canvas.width;
        this.glowCanvas.height = canvas.height;
        this.glowCtx = this.glowCanvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const ctx = this.ctx;
        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;
        const gy = CONFIG.GROUND_Y;

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, gy);
        skyGrad.addColorStop(0, '#1a1a2e');
        skyGrad.addColorStop(1, '#16213e');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, gy);

        // Ground surface
        ctx.fillStyle = '#3d2b1f';
        ctx.fillRect(0, gy, W, 8);

        // Underground layers
        const ugGrad = ctx.createLinearGradient(0, gy + 8, 0, H);
        ugGrad.addColorStop(0, '#4a3728');
        ugGrad.addColorStop(0.3, '#3a2a1a');
        ugGrad.addColorStop(0.7, '#2a1a0a');
        ugGrad.addColorStop(1, '#1a0a00');
        ctx.fillStyle = ugGrad;
        ctx.fillRect(0, gy + 8, W, H - gy - 8);

        // Some texture dots
        ctx.fillStyle = 'rgba(100,70,40,0.15)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 137 + 50) % W;
            const y = gy + 30 + (i * 89 + 20) % (H - gy - 60);
            ctx.beginPath();
            ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }

        // Miner character at top
        this._drawMiner(ctx);
    }

    _drawMiner(ctx) {
        const x = CONFIG.HOOK_ORIGIN_X;
        const y = CONFIG.HOOK_ORIGIN_Y;

        // Body
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(x - 12, y - 40, 24, 30);

        // Head
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(x, y - 50, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hard hat
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x, y - 58, 15, 6, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 13, y - 58, 26, 4);

        // Hat light
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x, y - 60, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDarknessOverlay(darknessAlpha, powerupModifier) {
        let alpha = darknessAlpha + powerupModifier;
        alpha = Math.max(0, Math.min(0.95, alpha));
        if (alpha <= 0) return;

        const ctx = this.ctx;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
    }

    drawItemGlows(items, pulseIntensity) {
        const ctx = this.ctx;
        for (const item of items) {
            item.drawGlow(ctx, pulseIntensity);
        }
    }

    drawStethoscopeOutlines(items) {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(65,105,225,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        for (const item of items) {
            if (!item.alive) continue;
            if (item.points > 0) {
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);
    }

    drawNightVisionSilhouettes(items) {
        const ctx = this.ctx;
        for (const item of items) {
            if (!item.alive) continue;
            ctx.fillStyle = 'rgba(0,255,0,0.2)';
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawRetractTrail(tipX, tipY, originX, originY) {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255,200,100,0.15)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
    }

    drawAimLine(originX, originY, targetX, targetY) {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Particle burst at collection point
    drawParticles(particles) {
        const ctx = this.ctx;
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
