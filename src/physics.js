import { GRAVITY } from './constants.js';

// ── Projectile trajectory ───────────────────────────────
export function getTrajectoryPoint(x0, y0, vx, vy, t) {
    return {
        x: x0 + vx * t,
        y: y0 + vy * t + 0.5 * GRAVITY * t * t,
    };
}

// ── Preview arc (dotted line) ───────────────────────────
export function getTrajectoryPoints(x0, y0, vx, vy, steps = 30, dt = 0.03) {
    const points = [];
    for (let i = 0; i < steps; i++) {
        const t = i * dt;
        points.push(getTrajectoryPoint(x0, y0, vx, vy, t));
    }
    return points;
}

// ── Circle vs Rectangle collision ───────────────────────
export function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= (cr * cr);
}

// ── Circle vs Circle collision ──────────────────────────
export function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = dx * dx + dy * dy;
    const radii = r1 + r2;
    return dist <= radii * radii;
}

// ── Distance helper ─────────────────────────────────────
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
