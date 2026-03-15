export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;

        // Current pointer state
        this.x = 0;
        this.y = 0;
        this.down = false;
        this.justPressed = false;
        this.justReleased = false;

        // Drag tracking
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragging = false;

        this._bindEvents();
    }

    setTransform(offsetX, offsetY, scale) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;
    }

    // Convert screen coords to logical game coords
    _toLogical(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const screenX = (clientX - rect.left) * dpr;
        const screenY = (clientY - rect.top) * dpr;
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale,
        };
    }

    _bindEvents() {
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => this._onDown(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this._onMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', (e) => this._onUp(e.clientX, e.clientY));

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._onDown(t.clientX, t.clientY);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._onMove(t.clientX, t.clientY);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._onUp(this.x * this.scale + this.offsetX, this.y * this.scale + this.offsetY);
        }, { passive: false });
    }

    _onDown(clientX, clientY) {
        const pos = this._toLogical(clientX, clientY);
        this.x = pos.x;
        this.y = pos.y;
        this.down = true;
        this.justPressed = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.dragging = true;
    }

    _onMove(clientX, clientY) {
        const pos = this._toLogical(clientX, clientY);
        this.x = pos.x;
        this.y = pos.y;
    }

    _onUp(clientX, clientY) {
        const pos = this._toLogical(clientX, clientY);
        this.x = pos.x;
        this.y = pos.y;
        this.down = false;
        this.justReleased = true;
        this.dragging = false;
    }

    // Call at end of each frame to clear one-frame flags
    endFrame() {
        this.justPressed = false;
        this.justReleased = false;
    }

    // Get drag vector (from start to current)
    getDragVector() {
        return {
            dx: this.x - this.dragStartX,
            dy: this.y - this.dragStartY,
        };
    }
}
