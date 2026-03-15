import { GRAVITY, AMMO_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class Projectile {
    constructor(x, y, vx, vy, type = 'boulder') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.config = AMMO_TYPES[type];
        this.radius = this.config.radius;
        this.alive = true;
        this.trail = [];
    }

    update(dt) {
        // Store trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();

        // Apply gravity
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Out of bounds
        if (this.x < -50 || this.x > CANVAS_WIDTH + 50 || this.y > CANVAS_HEIGHT + 50) {
            this.alive = false;
        }
    }

    render(ctx) {
        // Trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = i / this.trail.length;
            ctx.fillStyle = this.config.color;
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.4 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Main body
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
}
