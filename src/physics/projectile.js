// Drop Dead Keep — Boulder & Ammo Physics

import { getSprites } from '../sprites/pixel-data.js';
import { drawSprite, setupPixelCanvas } from '../sprites/sprite-renderer.js';

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

const AMMO_SPRITE_MAP = {
  boulder: 'boulder',
  fireball: 'fireball',
  ice_bomb: 'icebomb',
  mega_bomb: 'megabomb',
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
      // Draw trail as tiny 2x2 pixel squares
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        const alpha = (1 - t.age / 0.5) * 0.3;
        if (alpha <= 0) continue;
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        const size = Math.round(2 * this.currentScale);
        ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, size, size);
      }

      // Draw projectile sprite
      const sprites = getSprites();
      const spriteKey = AMMO_SPRITE_MAP[this.ammoType];
      const sprite = sprites.projectile[spriteKey];
      const spriteH = sprite.height;
      const drawScale = this.currentScale * 2;
      drawSprite(ctx, sprite, this.currentX, this.currentY + spriteH * drawScale / 2, drawScale);
    } else {
      // Draw impact effect
      this.drawImpact(ctx);
    }
  }

  drawImpact(ctx) {
    const t = this.impactTime;
    const x = Math.round(this.actualTargetX);
    const y = Math.round(this.actualTargetY);

    // Expanding pixel square ring (4 sides)
    const ringSize = Math.round(this.stats.splashRadius * Math.min(t * 3, 1));
    const alpha = Math.max(0, 1 - t * 1.5);

    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - ringSize, y - ringSize, ringSize * 2, ringSize * 2);

    // Dust particles as small pixel squares
    if (t < 0.8) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 2;
        const dist = ringSize * 0.7 * (1 + Math.sin(i * 3) * 0.3);
        const px = Math.round(x + Math.cos(angle) * dist);
        const py = Math.round(y + Math.sin(angle) * dist);
        const pAlpha = alpha * 0.6;
        const pSize = Math.round((4 + Math.sin(i * 7) * 2) * (1 - t));
        const drawSize = pSize > 2 ? 3 : 2;
        ctx.fillStyle = `rgba(180, 160, 120, ${pAlpha})`;
        ctx.fillRect(px - Math.floor(drawSize / 2), py - Math.floor(drawSize / 2), drawSize, drawSize);
      }
    }

    // Flash on first frame as white pixel square
    if (t < 0.1) {
      const flashSize = Math.round(20 * this.scale);
      ctx.fillStyle = `rgba(255, 255, 200, ${0.8 - t * 8})`;
      ctx.fillRect(x - flashSize, y - flashSize, flashSize * 2, flashSize * 2);
    }
  }
}

export function getAmmoStats(type) {
  return AMMO_STATS[type];
}
