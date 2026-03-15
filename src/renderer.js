import { COLORS } from './constants.js';

export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    // ── Sky gradient ────────────────────────────────────
    static drawSky(ctx, w, h) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, COLORS.skyTop);
        grad.addColorStop(1, COLORS.skyBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // ── Stars ───────────────────────────────────────────
    static drawStars(ctx, w, h, time) {
        const seed = 42;
        const count = 60;
        ctx.fillStyle = COLORS.stars;
        for (let i = 0; i < count; i++) {
            const x = ((seed * (i + 1) * 7) % 1000) / 1000 * w;
            const y = ((seed * (i + 1) * 13) % 1000) / 1000 * (h * 0.5);
            const flicker = 0.5 + 0.5 * Math.sin(time * 2 + i);
            ctx.globalAlpha = 0.3 + 0.7 * flicker;
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
    }

    // ── Crescent moon ───────────────────────────────────
    static drawMoon(ctx, x, y, r) {
        ctx.fillStyle = COLORS.moon;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // Shadow bite
        ctx.fillStyle = COLORS.skyTop;
        ctx.beginPath();
        ctx.arc(x + r * 0.6, y - r * 0.3, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Rounded rect helper ─────────────────────────────
    static roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ── Outlined text ───────────────────────────────────
    static drawText(ctx, text, x, y, { font = '14px monospace', fill = '#fff', stroke = null, strokeWidth = 3, align = 'left', baseline = 'top' } = {}) {
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
        }
        ctx.fillStyle = fill;
        ctx.fillText(text, x, y);
    }
}
