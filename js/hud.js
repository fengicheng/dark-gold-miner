// HUD - score, timer, lives, effects
import { CONFIG } from './config.js';

export class HUD {
    constructor() {
        this.floatingTexts = [];
        this.screenFlash = null;
        this.screenShake = { x: 0, y: 0, remaining: 0, intensity: 0 };
        this.edgeRedAlpha = 0;
    }

    addFloatingText(x, y, text, color, size = 20) {
        this.floatingTexts.push({ x, y, text, color, size, alpha: 1, vy: -60, life: 1.2 });
    }

    addScreenFlash(color, duration = 0.15) {
        this.screenFlash = { color, alpha: 0.4, duration, remaining: duration };
    }

    addScreenShake(intensity = 4, duration = 0.2) {
        this.screenShake.remaining = duration;
        this.screenShake.intensity = intensity;
    }

    update(dt, closestEnemyDist) {
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

        // Edge red based on closest enemy
        if (closestEnemyDist !== undefined && closestEnemyDist < CONFIG.DIST_WARN) {
            this.edgeRedAlpha = Math.min(0.4, (1 - closestEnemyDist / CONFIG.DIST_WARN) * 0.4);
        } else {
            this.edgeRedAlpha = Math.max(0, this.edgeRedAlpha - dt * 2);
        }
    }

    draw(ctx, score, targetScore, timeLeft, level, lives, ammoInfo) {
        const W = CONFIG.CANVAS_WIDTH;
        const H = CONFIG.CANVAS_HEIGHT;

        // Top bar
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
        ctx.fillStyle = timeLeft <= 10 ? '#FF4444' : '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.ceil(timeLeft)}秒`, W - 80, 18);

        // Lives
        ctx.fillStyle = '#FF4444';
        ctx.textAlign = 'right';
        ctx.font = '14px Arial';
        ctx.fillText('❤'.repeat(Math.max(0, lives)), W - 15, 18);

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
            ctx.save();
            ctx.fillStyle = this.screenFlash.color;
            ctx.globalAlpha = this.screenFlash.alpha;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

        // Ammo display (bottom right)
        if (ammoInfo) {
            const ax = W - 120;
            const ay = H - 40;
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            if (ammoInfo.reloading) {
                // Reload progress bar
                const barW = 100;
                const barH = 12;
                const bx = ax;
                const by = ay - 6;

                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx, by, barW, barH);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, by, barW, barH);

                const progress = ammoInfo.reloadProgress;
                ctx.fillStyle = '#FFAA00';
                ctx.fillRect(bx + 1, by + 1, (barW - 2) * progress, barH - 2);

                ctx.fillStyle = '#FFAA00';
                ctx.textAlign = 'center';
                ctx.fillText('换弹中...', bx + barW / 2, ay + 14);
            } else {
                ctx.fillStyle = ammoInfo.ammo <= 3 ? '#FF4444' : '#CCCCCC';
                ctx.textAlign = 'right';
                ctx.fillText(`${ammoInfo.ammo} / ${ammoInfo.magazineSize}`, W - 20, ay);
            }
        }

        // Edge red glow when enemies close
        if (this.edgeRedAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.edgeRedAlpha;
            // Top/bottom/left/right edge gradients
            const edgeSize = 40;
            for (const [x1, y1, x2, y2, rx, ry, rw, rh] of [
                [0, 0, 0, edgeSize, 0, 0, W, edgeSize],           // top
                [0, H, 0, H - edgeSize, 0, H - edgeSize, W, edgeSize], // bottom
                [0, 0, edgeSize, 0, 0, 0, edgeSize, H],           // left
                [W, 0, W - edgeSize, 0, W - edgeSize, 0, edgeSize, H], // right
            ]) {
                const g = ctx.createLinearGradient(x1, y1, x2, y2);
                g.addColorStop(0, 'rgba(255,0,0,0.6)');
                g.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(rx, ry, rw, rh);
            }
            ctx.restore();
        }
    }

    getShakeOffset() {
        return { x: this.screenShake.x, y: this.screenShake.y };
    }
}
