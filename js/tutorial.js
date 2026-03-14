// Minimal tutorial - first play hints
const TUTORIAL_KEY = 'darkDefense_tutDone';

export class Tutorial {
    constructor() {
        this.active = false;
        this.timer = 0;
    }

    shouldRun() {
        return !localStorage.getItem(TUTORIAL_KEY);
    }

    start() {
        this.active = true;
        this.timer = 0;
    }

    complete() {
        this.active = false;
        localStorage.setItem(TUTORIAL_KEY, '1');
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        if (this.timer > 30) this.complete();
    }

    draw(ctx, W, H) {
        if (!this.active) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.timer < 5) {
            // Show crosshair hint
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.timer * 3);
            ctx.fillStyle = '#ff0101';
            ctx.font = '16px Arial';
            ctx.fillText('移动鼠标瞄准，点击射击', W / 2, H / 2 - 80);
        } else if (this.timer < 12) {
            ctx.globalAlpha = Math.max(0, 1 - (this.timer - 5) / 3);
            ctx.fillStyle = 'rgb(243, 7, 7)';
            ctx.font = '14px Arial';
            ctx.fillText('屏幕即将变暗，注意雷达', W / 2, H / 2 - 80);
        } else if (this.timer < 22) {
            ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.timer * 2);
            ctx.fillStyle = 'rgb(250, 43, 6)';
            ctx.font = '14px Arial';
            ctx.fillText('击杀敌人会照亮周围区域', W / 2, H / 2 - 100);
        }

        ctx.restore();
    }
}
