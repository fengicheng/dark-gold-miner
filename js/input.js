// Input manager
import { CONFIG } from './config.js';

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = 450;
        this.mouseY = 300;
        this.mouseDown = false;
        this.clicked = false;
        this.keys = {};

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            let mx = (e.clientX - rect.left) * scaleX;
            let my = (e.clientY - rect.top) * scaleY;

            // Prevent cursor from entering radar semicircle area
            const dx = mx - CONFIG.TURRET_X;
            const dy = my - CONFIG.TURRET_Y;
            const dist = Math.hypot(dx, dy);
            const R = CONFIG.RADAR_RADIUS + 5; // small margin
            if (dist < R && dy <= 0) {
                // Push cursor to the edge of radar circle
                const angle = Math.atan2(dy, dx);
                mx = CONFIG.TURRET_X + Math.cos(angle) * R;
                my = CONFIG.TURRET_Y + Math.sin(angle) * R;
            }

            this.mouseX = mx;
            this.mouseY = my;
        });

        canvas.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this.mouseDown = true;
                this.clicked = true;
            }
        });

        canvas.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouseDown = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });

        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
        });
    }

    consumeClick() {
        if (this.clicked) {
            this.clicked = false;
            return true;
        }
        return false;
    }

    consumeKey(key) {
        if (this.keys[key]) {
            this.keys[key] = false;
            return true;
        }
        return false;
    }
}
