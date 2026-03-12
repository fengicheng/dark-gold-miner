// Tutorial system - first play guided experience
const TUTORIAL_KEY = 'darkGoldMiner_tutDone';

export class Tutorial {
    constructor() {
        this.active = false;
        this.step = 0;
        this.timer = 0;
        this.hintAlpha = 0;
        this.hintIcon = null;
        this.autoGrabDone = false;
        this.autoRockDone = false;
        this.mistakeCount = 0;
    }

    shouldRun() {
        return !localStorage.getItem(TUTORIAL_KEY);
    }

    start() {
        this.active = true;
        this.step = 0;
        this.timer = 0;
        this.autoGrabDone = false;
        this.autoRockDone = false;
        this.mistakeCount = 0;
    }

    complete() {
        this.active = false;
        localStorage.setItem(TUTORIAL_KEY, '1');
    }

    update(dt, elapsed, gameState) {
        if (!this.active) return;
        this.timer += dt;

        // Determine step based on elapsed game time
        if (elapsed < 5) {
            this.step = 0; // auto grab demo
        } else if (elapsed < 10) {
            this.step = 1; // hint to click
        } else if (elapsed < 15) {
            this.step = 2; // diamond flash hint
        } else if (elapsed < 20) {
            this.step = 3; // rock warning
        } else if (elapsed < 30) {
            this.step = 4; // free play with ear hint if mistakes
            if (gameState.consecutiveMistakes >= 2 && !this.hintIcon) {
                this.hintIcon = 'ear';
                this.hintAlpha = 1;
            }
        } else {
            this.step = 5; // normal play
        }

        // Fade hint
        if (this.hintAlpha > 0 && this.step !== 4) {
            this.hintAlpha = Math.max(0, this.hintAlpha - dt * 0.5);
        }
    }

    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.active) return;

        // Draw hint icon (ear for "listen")
        if (this.hintIcon === 'ear' && this.hintAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.hintAlpha * (0.5 + 0.5 * Math.sin(this.timer * 4));
            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👂', canvasWidth / 2, canvasHeight / 2);
            ctx.restore();
        }

        // Step 1: click hint - subtle mouse icon pulsing
        if (this.step === 1) {
            ctx.save();
            ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.timer * 3);
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🖱️', canvasWidth / 2, canvasHeight / 2 - 50);
            // Down arrow
            ctx.fillStyle = '#FFF';
            ctx.font = '30px Arial';
            ctx.fillText('↓', canvasWidth / 2, canvasHeight / 2);
            ctx.restore();
        }
    }

    // Get auto-fire target for demo phase
    getAutoTarget(items) {
        if (this.step !== 0 || this.autoGrabDone) return null;
        // Find a small gold to auto-grab
        for (const item of items) {
            if (item.type === 'smallGold' && item.alive) {
                this.autoGrabDone = true;
                return { x: item.x, y: item.y };
            }
        }
        return null;
    }
}
