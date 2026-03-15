// Drop Dead Keep — Boulder & Ammo Physics

const { Bodies, Body } = Matter;

export const AmmoType = {
  BOULDER: 'boulder',
  FIREBALL: 'fireball',
  ICE_BOMB: 'ice_bomb',
  MEGA_BOMB: 'mega_bomb',
};

const AMMO_STATS = {
  boulder: { damage: 35, radius: 12, color: '#888', splashRadius: 30, reloadTime: 1.5, accuracy: 1.0 },
  fireball: { damage: 25, radius: 10, color: '#e67e22', splashRadius: 50, reloadTime: 2.5, accuracy: 0.9 },
  ice_bomb: { damage: 15, radius: 10, color: '#5dade2', splashRadius: 40, reloadTime: 3.0, accuracy: 1.2 },
  mega_bomb: { damage: 80, radius: 16, color: '#f1c40f', splashRadius: 80, reloadTime: 4.0, accuracy: 0.7 },
};

export class Projectile {
  constructor(physics, x, y, targetX, targetY, ammoType, scale) {
    this.physics = physics;
    this.ammoType = ammoType;
    this.stats = AMMO_STATS[ammoType];
    this.scale = scale || 1;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.alive = true;
    this.impacted = false;
    this.impactTime = 0;
    this.trail = [];

    // Calculate flight — projectile flies from catapult (bottom) toward target (up-screen)
    // We simulate as a straight-line flight with perspective shrinking
    this.flightProgress = 0;
    this.flightDuration = 0.6 + Math.abs(targetY - y) / 1500; // longer for farther targets

    // Apply accuracy spread based on distance
    const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
    const maxDist = 800;
    const spreadFactor = (distance / maxDist) * (1 / this.stats.accuracy);
    const spreadRadius = spreadFactor * 40;

    // Gaussian-ish random offset
    const angle = Math.random() * Math.PI * 2;
    const r = spreadRadius * (Math.random() * 0.5 + Math.random() * 0.5); // biased toward center
    this.actualTargetX = targetX + Math.cos(angle) * r;
    this.actualTargetY = targetY + Math.sin(angle) * r;

    // Create physics body at start position (we'll animate manually then switch to physics)
    this.body = null;
    this.currentX = x;
    this.currentY = y;
    this.currentScale = 1;
  }

  update(dt) {
    if (!this.alive) return;

    if (!this.impacted) {
      this.flightProgress += dt / this.flightDuration;

      if (this.flightProgress >= 1) {
        this.flightProgress = 1;
        this.impact();
        return;
      }

      // Interpolate position with easing
      const t = this.flightProgress;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.currentX = this.startX + (this.actualTargetX - this.startX) * ease;
      this.currentY = this.startY + (this.actualTargetY - this.startY) * ease;

      // Shrink as it flies "away" (up the screen = farther from camera)
      const yNorm = this.currentY / 800; // 0 at top, 1 at bottom
      this.currentScale = 0.4 + yNorm * 0.6;

      // Trail
      this.trail.push({ x: this.currentX, y: this.currentY, age: 0 });
      if (this.trail.length > 15) this.trail.shift();
    } else {
      this.impactTime += dt;
      if (this.impactTime > 1.5) {
        this.alive = false;
      }
    }

    // Age trail
    for (const t of this.trail) t.age += dt;
  }

  impact() {
    this.impacted = true;
    this.impactTime = 0;
  }

  getImpactPosition() {
    return { x: this.actualTargetX, y: this.actualTargetY };
  }

  draw(ctx) {
    if (!this.alive) return;

    if (!this.impacted) {
      // Draw trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        const alpha = (1 - t.age / 0.5) * 0.3;
        if (alpha <= 0) continue;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 * this.currentScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.fill();
      }

      // Draw projectile
      const r = this.stats.radius * this.currentScale;
      ctx.beginPath();
      ctx.arc(this.currentX, this.currentY, r, 0, Math.PI * 2);
      ctx.fillStyle = this.stats.color;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2 * this.currentScale;
      ctx.stroke();

      // Highlight
      ctx.beginPath();
      ctx.arc(this.currentX - r * 0.3, this.currentY - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    } else {
      // Draw impact effect
      this.drawImpact(ctx);
    }
  }

  drawImpact(ctx) {
    const t = this.impactTime;
    const x = this.actualTargetX;
    const y = this.actualTargetY;

    // Expanding ring
    const ringRadius = this.stats.splashRadius * Math.min(t * 3, 1);
    const alpha = Math.max(0, 1 - t * 1.5);

    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dust particles
    if (t < 0.8) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 2;
        const dist = ringRadius * 0.7 * (1 + Math.sin(i * 3) * 0.3);
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        const pAlpha = alpha * 0.6;
        const pSize = (4 + Math.sin(i * 7) * 2) * (1 - t);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 160, 120, ${pAlpha})`;
        ctx.fill();
      }
    }

    // Flash on first frame
    if (t < 0.1) {
      ctx.beginPath();
      ctx.arc(x, y, 20 * this.scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 200, ${0.8 - t * 8})`;
      ctx.fill();
    }
  }
}

export function getAmmoStats(type) {
  return AMMO_STATS[type];
}
