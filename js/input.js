// Input manager
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
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
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
