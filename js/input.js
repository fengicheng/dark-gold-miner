// Input manager for mouse and keyboard
export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.clicked = false;
        this.mouseDown = false;
        this.mouseDownTime = 0;
        this.keys = {};
        this.hoveredItem = null;

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', e => {
            this.mouseDown = true;
            this.mouseDownTime = performance.now();
        });

        canvas.addEventListener('mouseup', e => {
            if (this.mouseDown) {
                this.clicked = true;
            }
            this.mouseDown = false;
        });

        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                this.clicked = true;
                e.preventDefault();
            }
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

    isHolding() {
        return this.mouseDown && (performance.now() - this.mouseDownTime > 150);
    }

    consumeKey(key) {
        if (this.keys[key]) {
            this.keys[key] = false;
            return true;
        }
        return false;
    }
}
