// Drop Dead Keep — Input Handling (Keyboard, Mouse, Touch)

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
    this.keys = {};
    this.keysJustPressed = {};
    this.touchActive = false;

    this.setupListeners();
  }

  setupListeners() {
    // Mouse
    this.canvas.addEventListener('mousedown', (e) => {
      this.updateMousePos(e);
      this.mouseDown = true;
      this.mouseJustPressed = true;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePos(e);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.updateMousePos(e);
      this.mouseDown = false;
      this.mouseJustReleased = true;
    });

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchActive = true;
      const touch = e.touches[0];
      this.updateTouchPos(touch);
      this.mouseDown = true;
      this.mouseJustPressed = true;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        this.updateTouchPos(e.touches[0]);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mouseDown = false;
      this.mouseJustReleased = true;
      this.touchActive = false;
    }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.key]) {
        this.keysJustPressed[e.key] = true;
      }
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  updateMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  updateTouchPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouseY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  isKeyJustPressed(key) {
    return this.keysJustPressed[key] || false;
  }

  endFrame() {
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
    this.keysJustPressed = {};
  }
}
