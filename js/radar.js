// Radar system - semicircle centered on turret
import { CONFIG } from './config.js';

export class Radar {
    constructor() {
        this.scanAngle = 0;
        this.blipFlashes = []; // {enemyId, timer}
    }

    reset() {
        this.scanAngle = 0;
        this.blipFlashes = [];
    }

    update(dt) {
        // Sweep from left (-PI) to right (0), i.e. over the upper semicircle
        this.scanAngle += CONFIG.RADAR_SCAN_SPEED * dt;
        if (this.scanAngle > Math.PI) this.scanAngle -= Math.PI;

        // Decay flashes
        for (const f of this.blipFlashes) {
            f.timer -= dt;
        }
        this.blipFlashes = this.blipFlashes.filter(f => f.timer > 0);
    }

    addBlipFlash(id) {
        if (!this.blipFlashes.find(f => f.id === id)) {
            this.blipFlashes.push({ id, timer: 0.5 });
        }
    }

    draw(ctx, enemies, radarBoostActive) {
        const cx = CONFIG.TURRET_X;
        const cy = CONFIG.TURRET_Y;
        const R = CONFIG.RADAR_RADIUS;

        ctx.save();

        // Semi-transparent background (upper semicircle)
        ctx.fillStyle = 'rgba(0,20,0,0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI, 0); // upper semicircle
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(0,255,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI, 0);
        ctx.closePath();
        ctx.stroke();

        // Distance rings (50% and 75%)
        ctx.strokeStyle = 'rgba(0,255,0,0.12)';
        ctx.setLineDash([2, 4]);
        for (const frac of [0.5, 0.75]) {
            ctx.beginPath();
            ctx.arc(cx, cy, R * frac, Math.PI, 0);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Center line
        ctx.strokeStyle = 'rgba(0,255,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - R);
        ctx.stroke();

        // Scan line
        const scanX = cx + Math.cos(Math.PI + this.scanAngle) * R;
        const scanY = cy + Math.sin(Math.PI + this.scanAngle) * R;
        ctx.strokeStyle = 'rgba(0,255,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(scanX, scanY);
        ctx.stroke();

        // Scan sweep glow
        ctx.fillStyle = 'rgba(0,255,0,0.05)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, Math.PI + this.scanAngle - 0.3, Math.PI + this.scanAngle, false);
        ctx.closePath();
        ctx.fill();

        // Enemy blips
        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            // Map enemy world position to radar position
            const dx = enemy.x - cx;
            const dy = enemy.y - cy;
            const worldDist = Math.hypot(dx, dy);

            // Max world distance = distance from turret to farthest point
            const maxWorldDist = CONFIG.CANVAS_HEIGHT;
            const radarDist = Math.min(1, worldDist / maxWorldDist) * R;

            // Angle from turret (0 = up, negative = left, positive = right)
            const worldAngle = Math.atan2(dx, -dy); // 0=up, PI/2=right, -PI/2=left

            // Only show if in upper hemisphere
            if (dy > 20) continue; // enemy below turret, skip

            // Radar coordinates
            const rx = cx + Math.sin(worldAngle) * radarDist;
            const ry = cy - Math.cos(worldAngle) * radarDist;

            // Check if within radar semicircle
            if (ry > cy) continue;

            // Get color
            const color = enemy.getRadarColor();

            // Flash effect when color changes or new spawn
            const flash = this.blipFlashes.find(f => f.id === enemy);
            const brightness = flash ? 1.5 : 1;

            // Check if scan line is near this blip (brightens it)
            const blipAngle = Math.atan2(ry - cy, rx - cx);
            const scanLineAngle = Math.atan2(scanY - cy, scanX - cx);
            const angleDiff = Math.abs(blipAngle - scanLineAngle);
            const nearScan = angleDiff < 0.3 ? 1.3 : 1;

            const size = enemy.type === 'heavy' ? 4 : 3;

            ctx.save();
            ctx.globalAlpha = Math.min(1, brightness * nearScan);

            if (enemy.type === 'stealth' && !radarBoostActive) {
                // Rotating green diamond
                ctx.translate(rx, ry);
                ctx.rotate(Date.now() * 0.003);
                ctx.fillStyle = '#00FF00';
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(4, 0);
                ctx.lineTo(0, 4);
                ctx.lineTo(-4, 0);
                ctx.closePath();
                ctx.fill();
            } else if (enemy.type === 'heavy') {
                // Larger circle with edge wobble
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(rx, ry, size, 0, Math.PI * 2);
                ctx.fill();
                // Edge wave
                ctx.strokeStyle = color;
                ctx.lineWidth = 0.5;
                ctx.globalAlpha *= 0.5;
                ctx.beginPath();
                ctx.arc(rx, ry, size + 2 + Math.sin(Date.now() * 0.01) * 1, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Regular circle
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(rx, ry, size, 0, Math.PI * 2);
                ctx.fill();

                // Bomber in red zone: rapid flash
                if (enemy.type === 'bomber' && enemy.bomberActive) {
                    ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.015));
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.arc(rx, ry, size + 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        ctx.restore();
    }
}
