// Main renderer
import { CONFIG } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const ctx = this.ctx;
        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;

        // Dark battlefield gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0a15');
        grad.addColorStop(0.5, '#0d0d1a');
        grad.addColorStop(1, '#111122');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Ground line
        ctx.strokeStyle = 'rgba(50,50,80,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.TURRET_Y + CONFIG.TURRET_RADIUS + 5);
        ctx.lineTo(W, CONFIG.TURRET_Y + CONFIG.TURRET_RADIUS + 5);
        ctx.stroke();

        // Subtle grid in background
        ctx.strokeStyle = 'rgba(30,30,50,0.15)';
        for (let x = 0; x < W; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    drawDarknessOverlay(alpha) {
        if (alpha <= 0) return;
        this.ctx.fillStyle = `rgba(0,0,0,${Math.min(0.95, alpha)})`;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    drawCrosshair(ctx, x, y, hitFeedback) {
        ctx.save();
        ctx.translate(x, y);

        const color = hitFeedback > 0 ? '#FF4444' : 'rgba(200,220,255,0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = hitFeedback > 0 ? 10 : 4;

        const size = 12;
        // Cross
        ctx.beginPath();
        ctx.moveTo(-size, 0); ctx.lineTo(-4, 0);
        ctx.moveTo(4, 0); ctx.lineTo(size, 0);
        ctx.moveTo(0, -size); ctx.lineTo(0, -4);
        ctx.moveTo(0, 4); ctx.lineTo(0, size);
        ctx.stroke();

        // Circle
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Hit shockwave
        if (hitFeedback > 0) {
            ctx.strokeStyle = `rgba(255,100,100,${hitFeedback})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 12 + (1 - hitFeedback) * 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawIllumination(ctx, x, y, alpha) {
        const radius = CONFIG.ILLUMINATE_RADIUS;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,200,100,${alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255,150,50,${alpha * 0.15})`);
        gradient.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

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
