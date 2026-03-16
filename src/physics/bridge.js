// Drop Dead Keep — Bridge Construction & Destruction

import { getSprites } from '../sprites/pixel-data.js';
import { drawSpriteAt, setupPixelCanvas } from '../sprites/sprite-renderer.js';
import { drawPixelBar } from '../sprites/pixel-font.js';

const { Bodies, Constraint, Body } = Matter;

export const BridgeType = {
  ROPE: 'rope',
  WOODEN: 'wooden',
  STONE: 'stone',
};

const BRIDGE_STATS = {
  rope: { hp: 30, plankCount: 5, plankWidth: 24, plankHeight: 8, color: '#8B6914', rebuildTime: 5, breakForce: 0.03 },
  wooden: { hp: 60, plankCount: 6, plankWidth: 28, plankHeight: 10, color: '#6B4226', rebuildTime: 10, breakForce: 0.06 },
  stone: { hp: 100, plankCount: 4, plankWidth: 32, plankHeight: 14, color: '#777', rebuildTime: 20, breakForce: 0.1 },
};

const BRIDGE_SPRITE_MAP = {
  rope: 'rope',
  wooden: 'wood',
  stone: 'stone',
};

export class Bridge {
  constructor(physics, x, y, width, type, scale) {
    this.physics = physics;
    this.x = x;
    this.y = y;
    this.width = width;
    this.type = type;
    this.scale = scale || 1;
    const stats = BRIDGE_STATS[type];
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.rebuildTime = stats.rebuildTime;
    this.color = stats.color;
    this.destroyed = false;
    this.zombieBridged = false;
    this.planks = [];
    this.constraints = [];
    this.debris = [];

    this.buildPhysics(stats);
  }

  buildPhysics(stats) {
    const plankW = stats.plankWidth * this.scale;
    const plankH = stats.plankHeight * this.scale;
    const count = stats.plankCount;
    const gap = count > 1 ? (this.width - plankW) / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const px = this.x - this.width / 2 + plankW / 2 + gap * i;
      const plank = Bodies.rectangle(px, this.y, plankW, plankH, {
        density: 0.005,
        friction: 0.8,
        restitution: 0.2,
        isStatic: true,
        label: 'bridge-plank',
        render: { fillStyle: this.color },
      });
      plank.bridge = this;
      plank.plankIndex = i;
      this.planks.push(plank);
      this.physics.addBody(plank);
    }

    // Connect planks with constraints
    for (let i = 0; i < count - 1; i++) {
      const c = Constraint.create({
        bodyA: this.planks[i],
        bodyB: this.planks[i + 1],
        stiffness: 0.8,
        damping: 0.1,
        length: gap,
        label: 'bridge-constraint',
      });
      c.breakForce = stats.breakForce;
      this.constraints.push(c);
      this.physics.addConstraint(c);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.destroy();
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.zombieBridged = false;

    // Release all planks — make them dynamic so they fall
    for (const plank of this.planks) {
      Body.setStatic(plank, false);
      // Add slight random velocity for scatter effect
      Body.setVelocity(plank, {
        x: (Math.random() - 0.5) * 3,
        y: Math.random() * -2,
      });
      Body.setAngularVelocity(plank, (Math.random() - 0.5) * 0.2);
      this.debris.push(plank);
    }

    // Remove constraints
    for (const c of this.constraints) {
      this.physics.removeConstraint(c);
    }
    this.constraints = [];
    this.planks = [];
  }

  rebuild(toHpPercent) {
    if (!this.destroyed) return;
    this.destroyed = false;
    this.zombieBridged = false;
    this.hp = this.maxHp * (toHpPercent || 0.5);

    // Remove old debris
    for (const d of this.debris) {
      this.physics.removeBody(d);
    }
    this.debris = [];

    // Clear any stale references before rebuilding
    for (const p of this.planks) {
      this.physics.removeBody(p);
    }
    this.planks = [];
    for (const c of this.constraints) {
      this.physics.removeConstraint(c);
    }
    this.constraints = [];

    // Rebuild physics
    const stats = BRIDGE_STATS[this.type];
    this.buildPhysics(stats);
  }

  getHpPercent() {
    return this.hp / this.maxHp;
  }

  draw(ctx) {
    const sprites = getSprites();
    setupPixelCanvas(ctx);

    if (this.destroyed) {
      // Draw small pixel stubs on each side
      const stubW = Math.round(8 * this.scale);
      const stubH = Math.round(6 * this.scale);
      ctx.fillStyle = '#555';
      ctx.fillRect(
        Math.round(this.x - this.width / 2 - stubW),
        Math.round(this.y - stubH / 2),
        stubW,
        stubH
      );
      ctx.fillRect(
        Math.round(this.x + this.width / 2),
        Math.round(this.y - stubH / 2),
        stubW,
        stubH
      );
      return;
    }

    // Get the correct plank sprite for this bridge type
    const spriteKey = BRIDGE_SPRITE_MAP[this.type];
    const plankSprite = sprites.bridge[spriteKey];
    const stats = BRIDGE_STATS[this.type];

    // Draw intact/damaged bridge planks
    for (const plank of this.planks) {
      const pw = stats.plankWidth * this.scale;
      const ph = stats.plankHeight * this.scale;
      ctx.save();
      ctx.translate(plank.position.x, plank.position.y);
      ctx.rotate(plank.angle);

      // Calculate scale to match plank dimensions
      const scaleX = pw / plankSprite.width;
      const scaleY = ph / plankSprite.height;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        plankSprite,
        Math.round(-pw / 2),
        Math.round(-ph / 2),
        Math.round(pw),
        Math.round(ph)
      );

      ctx.restore();
    }

    // Draw ropes/supports using ropeSegment sprites
    if (this.type === 'rope') {
      const ropeSprite = sprites.bridge.ropeSegment;
      const ropeY = this.y - 10 * this.scale;
      const startX = this.x - this.width / 2 - 5;
      const endX = this.x + this.width / 2 + 5;
      const segW = ropeSprite.width * this.scale;
      const segH = ropeSprite.height * this.scale;

      for (let rx = startX; rx < endX; rx += segW) {
        drawSpriteAt(ctx, ropeSprite, rx, ropeY - segH / 2, this.scale);
      }
    }

    // HP bar when damaged
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = Math.round(this.width * 0.6);
      const barH = Math.round(4 * this.scale);
      const barX = Math.round(this.x - barW / 2);
      const barY = Math.round(this.y - 16 * this.scale);
      drawPixelBar(ctx, barX, barY, barW, barH, this.hp, this.maxHp);
    }
  }

  drawDebris(ctx) {
    const sprites = getSprites();
    const spriteKey = BRIDGE_SPRITE_MAP[this.type];
    const plankSprite = sprites.bridge[spriteKey];
    const stats = BRIDGE_STATS[this.type];

    for (const d of this.debris) {
      const pw = stats.plankWidth * this.scale;
      const ph = stats.plankHeight * this.scale;
      ctx.save();
      ctx.translate(d.position.x, d.position.y);
      ctx.rotate(d.angle);
      ctx.globalAlpha = 0.7;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        plankSprite,
        Math.round(-pw / 2),
        Math.round(-ph / 2),
        Math.round(pw),
        Math.round(ph)
      );
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
