// HUD rendering - score, timer, level info
import { CONFIG } from './config.js';

export class HUD {
    constructor() {
        this.floatingTexts = [];
        this.screenFlash = null; // {color, alpha, duration}
        this.screenShake = { x: 0, y: 0, remaining: 0 };
    }

    addFloatingText(x, y, text, color, size = 20) {
        this.floatingTexts.push({
            x, y, text, color, size,
            alpha: 1,
            vy: -60,
            life: 1.2,
        });
    }

    addScreenFlash(color, duration = 0.15) {
        this.screenFlash = { color, alpha: 0.4, duration, remaining: duration };
    }

    addScreenShake(intensity = 4, duration = 0.2) {
        this.screenShake.remaining = duration;
        this.screenShake.intensity = intensity;
    }

    update(dt) {
        // Floating texts
        for (const ft of this.floatingTexts) {
            ft.y += ft.vy * dt;
            ft.vy *= 0.98;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / 1.2);
        }
        this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

        // Screen flash
        if (this.screenFlash) {
            this.screenFlash.remaining -= dt;
            this.screenFlash.alpha = Math.max(0, 0.4 * this.screenFlash.remaining / this.screenFlash.duration);
            if (this.screenFlash.remaining <= 0) this.screenFlash = null;
        }

        // Screen shake
        if (this.screenShake.remaining > 0) {
            this.screenShake.remaining -= dt;
            const i = this.screenShake.intensity;
            this.screenShake.x = (Math.random() - 0.5) * i * 2;
            this.screenShake.y = (Math.random() - 0.5) * i * 2;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }

    draw(ctx, score, targetScore, timeLeft, level, mistakes) {
        const W = CONFIG.CANVAS_WIDTH;

        // Top bar background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 35);

        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textBaseline = 'middle';

        // Level
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'left';
        ctx.fillText(`关卡 ${level}`, 15, 18);

        // Score
        ctx.fillStyle = score >= targetScore ? '#00FF00' : '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(`${score} / ${targetScore}`, W / 2, 18);

        // Timer
        const timeColor = timeLeft <= 10 ? '#FF4444' : '#FFFFFF';
        ctx.fillStyle = timeColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.ceil(timeLeft)}秒`, W - 15, 18);

        // Mistakes indicator
        if (mistakes > 0) {
            ctx.fillStyle = '#FF6666';
            ctx.textAlign = 'right';
            ctx.font = '12px Arial';
            ctx.fillText('✕'.repeat(mistakes), W - 70, 18);
        }

        // Time ring at edges
        if (timeLeft < CONFIG.ROUND_DURATION) {
            const progress = timeLeft / CONFIG.ROUND_DURATION;
            ctx.strokeStyle = `rgba(255,${Math.floor(progress * 255)},0,${0.15 + (1 - progress) * 0.15})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(W / 2, CONFIG.CANVAS_HEIGHT / 2, Math.min(W, CONFIG.CANVAS_HEIGHT) / 2 - 5,
                -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();
        }

        // Floating texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `bold ${ft.size}px Arial`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        // Screen flash overlay
        if (this.screenFlash) {
            ctx.fillStyle = this.screenFlash.color;
            ctx.globalAlpha = this.screenFlash.alpha;
            ctx.fillRect(0, 0, W, CONFIG.CANVAS_HEIGHT);
            ctx.globalAlpha = 1;
        }
    }

    getShakeOffset() {
        return { x: this.screenShake.x, y: this.screenShake.y };
    }
}
