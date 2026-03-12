// Hook mechanics: swing, fire, retract
import { CONFIG } from './config.js';

export const HookState = {
    SWINGING: 'swinging',
    FIRING: 'firing',
    RETRACTING: 'retracting',
};

export class Hook {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = HookState.SWINGING;
        this.angle = 0; // current swing angle
        this.swingTime = 0;
        this.originX = CONFIG.HOOK_ORIGIN_X;
        this.originY = CONFIG.HOOK_ORIGIN_Y;
        this.tipX = this.originX;
        this.tipY = this.originY;
        this.dirX = 0;
        this.dirY = 1;
        this.distance = 0;
        this.maxDistance = 0;
        this.caughtItem = null;
        this.retractSpeed = CONFIG.HOOK_RETRACT_BASE_SPEED;
        this.ropeLength = 30; // visual minimum
    }

    fire(targetX, targetY) {
        if (this.state !== HookState.SWINGING) return;

        const dx = targetX - this.originX;
        const dy = targetY - this.originY;
        const len = Math.hypot(dx, dy);
        if (len < 10 || dy < 5) return; // must fire downward-ish

        this.dirX = dx / len;
        this.dirY = dy / len;
        this.distance = 0;
        this.maxDistance = Math.hypot(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.state = HookState.FIRING;
        this.caughtItem = null;
    }

    fireAtAngle() {
        // Fire along current swing angle
        if (this.state !== HookState.SWINGING) return;
        const dx = Math.sin(this.angle);
        const dy = Math.cos(this.angle);
        this.dirX = dx;
        this.dirY = dy;
        this.distance = 0;
        this.maxDistance = Math.hypot(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.state = HookState.FIRING;
        this.caughtItem = null;
    }

    update(dt, items) {
        switch (this.state) {
            case HookState.SWINGING:
                this.swingTime += dt;
                this.angle = Math.sin(this.swingTime * CONFIG.HOOK_SWING_SPEED) * CONFIG.HOOK_SWING_MAX_ANGLE;
                this.tipX = this.originX + Math.sin(this.angle) * this.ropeLength;
                this.tipY = this.originY + Math.cos(this.angle) * this.ropeLength;
                break;

            case HookState.FIRING:
                this.distance += CONFIG.HOOK_FIRE_SPEED * dt;
                this.tipX = this.originX + this.dirX * this.distance;
                this.tipY = this.originY + this.dirY * this.distance;

                // Check bounds
                if (this.tipX < 0 || this.tipX > CONFIG.CANVAS_WIDTH ||
                    this.tipY < 0 || this.tipY > CONFIG.CANVAS_HEIGHT) {
                    this._startRetract(null);
                    break;
                }

                // Check collision with items
                for (const item of items) {
                    if (!item.alive) continue;
                    const dist = Math.hypot(this.tipX - item.x, this.tipY - item.y);
                    if (dist < item.radius + CONFIG.HOOK_LENGTH * 0.5) {
                        this._startRetract(item);
                        break;
                    }
                }
                break;

            case HookState.RETRACTING:
                this.distance -= this.retractSpeed * dt;
                this.tipX = this.originX + this.dirX * this.distance;
                this.tipY = this.originY + this.dirY * this.distance;

                if (this.caughtItem) {
                    this.caughtItem.x = this.tipX;
                    this.caughtItem.y = this.tipY;
                }

                if (this.distance <= this.ropeLength) {
                    const caught = this.caughtItem;
                    if (caught) caught.alive = false;
                    this.state = HookState.SWINGING;
                    this.caughtItem = null;
                    return caught; // return caught item
                }
                break;
        }
        return null;
    }

    _startRetract(item) {
        this.state = HookState.RETRACTING;
        this.caughtItem = item;
        this.retractSpeed = item
            ? CONFIG.HOOK_RETRACT_BASE_SPEED / item.weight
            : CONFIG.HOOK_RETRACT_BASE_SPEED * 2;
    }

    draw(ctx) {
        // Draw rope
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(this.tipX, this.tipY);
        ctx.stroke();

        // Draw hook
        ctx.save();
        ctx.translate(this.tipX, this.tipY);
        const angle = Math.atan2(this.tipX - this.originX, this.tipY - this.originY);
        ctx.rotate(-angle);

        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Hook shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -5);
        ctx.stroke();

        ctx.restore();
    }

    drawGlow(ctx) {
        // Hook tip glow in dark
        ctx.save();
        const gradient = ctx.createRadialGradient(this.tipX, this.tipY, 0, this.tipX, this.tipY, 15);
        gradient.addColorStop(0, 'rgba(255,200,100,0.4)');
        gradient.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.tipX, this.tipY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
