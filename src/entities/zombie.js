// Drop Dead Keep — Zombie Entities

import { getSprites } from '../sprites/pixel-data.js';
import { drawSprite, setupPixelCanvas } from '../sprites/sprite-renderer.js';

export const ZombieType = {
  SHAMBLER: 'shambler',
  SPRINTER: 'sprinter',
  PLANK_CARRIER: 'plank_carrier',
  ENGINEER: 'engineer',
  BRUTE: 'brute',
};

const ZOMBIE_STATS = {
  shambler: { hp: 1, speed: 30, damage: 1, color: '#4CAF50', size: 12, name: 'Shambler' },
  sprinter: { hp: 1, speed: 90, damage: 1, color: '#8BC34A', size: 10, name: 'Sprinter' },
  plank_carrier: { hp: 2, speed: 25, damage: 1, color: '#4CAF50', size: 14, name: 'Plank Carrier' },
  engineer: { hp: 2, speed: 28, damage: 1, color: '#4CAF50', size: 12, name: 'Engineer' },
  brute: { hp: 5, speed: 20, damage: 4, color: '#2E7D32', size: 20, name: 'Brute' },
};

// Map zombie types to sprite keys
const SPRITE_KEY_MAP = {
  shambler: 'shambler',
  sprinter: 'sprinter',
  brute: 'brute',
  engineer: 'engineer',
  plank_carrier: 'carrier',
};

export class Zombie {
  constructor(type, x, y) {
    const stats = ZOMBIE_STATS[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.baseSpeed = stats.speed;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.color = stats.color;
    this.baseSize = stats.size;
    this.size = stats.size;
    this.name = stats.name;

    this.alive = true;
    this.falling = false;
    this.fallVelocity = 0;
    this.reachedGate = false;
    this.targetWaypoint = 0;
    this.waypoints = [];

    // Animation
    this.walkCycle = Math.random() * Math.PI * 2;
    this.facingRight = true;
    this.flashTimer = 0;

    // Plank mechanic — any zombie can become a bridge plank
    this.becomingPlank = false;
    this.isPlank = false;
    this.plankTimer = 0;
    this.plankBridge = null;
  }

  setPath(waypoints) {
    this.waypoints = waypoints;
    this.targetWaypoint = 0;
  }

  update(dt, bridges) {
    if (!this.alive) return;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Perspective scaling based on Y position
    const yNorm = this.y / 800;
    const perspectiveScale = 0.4 + yNorm * 0.6;
    this.size = this.baseSize * perspectiveScale;

    if (this.falling) {
      this.fallVelocity += 400 * dt;
      this.y += this.fallVelocity * dt;
      this.size *= 0.98;
      if (this.y > 1000) {
        this.alive = false;
        this.falling = false; // Allow cleanup by wave system
      }
      return;
    }

    // Zombie is positioning itself to become a plank
    if (this.becomingPlank) {
      this.plankTimer += dt;
      if (this.plankTimer >= 1.0) {
        // Done positioning — become the bridge plank
        this.becomingPlank = false;
        this.isPlank = true;
        if (this.plankBridge) {
          this.plankBridge.zombieBridged = true;
        }
      }
      return;
    }

    // Already a plank — stay put, do nothing
    if (this.isPlank) return;

    // Follow waypoints
    if (this.targetWaypoint < this.waypoints.length) {
      const wp = this.waypoints[this.targetWaypoint];
      const dx = wp.x - this.x;
      const dy = wp.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Check if this waypoint has a bridge
        if (wp.bridge && wp.bridge.destroyed) {
          if (wp.bridge.zombieBridged) {
            // Another zombie already became the plank — walk across
            this.targetWaypoint++;
          } else {
            // Sacrifice self to become the bridge plank
            this.becomingPlank = true;
            this.plankTimer = 0;
            this.plankBridge = wp.bridge;
            return;
          }
        }
        this.targetWaypoint++;
      } else {
        // Move toward waypoint
        const moveSpeed = this.speed * perspectiveScale * dt;
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        this.facingRight = dx > 0;
      }
    } else {
      // Reached the end of the path (the gate)
      this.reachedGate = true;
    }

    // Walk animation
    this.walkCycle += dt * this.speed * 0.1;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  isInRadius(x, y, radius) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= radius + this.size;
  }

  draw(ctx) {
    if (!this.alive && !this.falling) return;

    const sprites = getSprites();
    const spriteKey = SPRITE_KEY_MAP[this.type];
    const spriteFrames = sprites.zombie[spriteKey];
    const frameIndex = Math.floor(this.walkCycle * 2) % 2;
    const spriteFrame = spriteFrames[frameIndex];

    const s = this.size;
    const x = this.x;
    const y = this.y;

    // Walk bob
    const bob = (this.falling || this.becomingPlank || this.isPlank) ? 0 : Math.sin(this.walkCycle) * 2;

    // Sprite scale: size / 5 so sprite scales with perspective
    const spriteScale = s / 5;

    // Determine draw options
    const opts = {
      flipX: !this.facingRight,
    };

    // Falling: rotation and fade
    if (this.falling) {
      opts.rotation = this.fallVelocity * 0.003;
      opts.alpha = Math.max(0, 1 - this.fallVelocity / 300);
    }

    // Becoming plank: gradually rotate to lie flat
    if (this.becomingPlank) {
      const progress = Math.min(this.plankTimer / 1.0, 1);
      opts.rotation = (Math.PI / 2) * progress;
      opts.alpha = 1;
    }

    // Is plank: fully lying flat, slightly transparent
    if (this.isPlank) {
      opts.rotation = Math.PI / 2;
      opts.alpha = 0.85;
    }

    ctx.save();
    setupPixelCanvas(ctx);

    // Draw the sprite
    drawSprite(ctx, spriteFrame, x, y + bob, spriteScale, opts);

    // Flash white on damage: overlay a white rectangle over the sprite area
    if (this.flashTimer > 0) {
      const flashAlpha = 0.5 + Math.sin(this.flashTimer * 30) * 0.5;
      const w = spriteFrame.width * spriteScale;
      const h = spriteFrame.height * spriteScale;
      const drawX = Math.round(x - w / 2);
      const drawY = Math.round(y + bob - h);

      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX, drawY, Math.round(w), Math.round(h));
      ctx.restore();
    }

    ctx.restore();
  }
}
