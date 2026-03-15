// Drop Dead Keep — Camera (Pan, Zoom, Follow)

export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  shake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDecay = this.shakeIntensity;
  }

  update(dt) {
    // Smooth zoom
    this.zoom += (this.targetZoom - this.zoom) * 5 * dt;

    // Screen shake
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= Math.pow(0.05, dt); // Exponential decay
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    if (this.zoom !== 1) {
      ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-this.canvasWidth / 2, -this.canvasHeight / 2);
    }
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }

  resize(w, h) {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }
}
