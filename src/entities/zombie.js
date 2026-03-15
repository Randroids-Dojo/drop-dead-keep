// Drop Dead Keep — Zombie Entities

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

    // Builder-specific
    this.isBuilding = false;
    this.buildProgress = 0;
    this.targetBridge = null;
    this.carriedPlanks = type === ZombieType.PLANK_CARRIER;
    this.hasPlacedPlanks = false;

    // Sprinter-specific
    this.canJumpSmallGaps = type === ZombieType.SPRINTER;
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

    // Engineer building behavior
    if (this.type === ZombieType.ENGINEER && this.isBuilding) {
      this.buildProgress += dt;
      const buildTime = this.targetBridge ? this.targetBridge.rebuildTime : 5;
      if (this.buildProgress >= buildTime && this.targetBridge) {
        this.targetBridge.rebuild(0.5);
        this.isBuilding = false;
        this.targetBridge = null;
        this.buildProgress = 0;
      }
      return;
    }

    // Follow waypoints
    if (this.targetWaypoint < this.waypoints.length) {
      const wp = this.waypoints[this.targetWaypoint];
      const dx = wp.x - this.x;
      const dy = wp.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Check if this waypoint has a bridge
        if (wp.bridge && wp.bridge.destroyed) {
          // Bridge is destroyed!
          if (this.type === ZombieType.ENGINEER && !this.isBuilding) {
            // Engineer starts repairing
            this.isBuilding = true;
            this.buildProgress = 0;
            this.targetBridge = wp.bridge;
            return;
          } else if (this.type === ZombieType.PLANK_CARRIER && !this.hasPlacedPlanks) {
            // Plank carrier drops planks — create a temporary crossing
            this.hasPlacedPlanks = true;
            wp.bridge.rebuild(0.15); // Very weak crossing
            this.carriedPlanks = false;
          } else if (this.canJumpSmallGaps && wp.bridge.width < 80) {
            // Sprinter can jump small gaps
            this.targetWaypoint++;
          } else {
            // Fall into the gap!
            this.falling = true;
            this.fallVelocity = 0;
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

    const s = this.size;
    const x = this.x;
    const y = this.y;

    // Walk bob
    const bob = this.falling ? 0 : Math.sin(this.walkCycle) * 2;

    ctx.save();

    // Flash white on damage
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(this.flashTimer * 30) * 0.5;
    }

    // Falling rotation
    if (this.falling) {
      ctx.translate(x, y);
      ctx.rotate(this.fallVelocity * 0.003);
      ctx.translate(-x, -y);
      ctx.globalAlpha = Math.max(0, 1 - this.fallVelocity / 300);
    }

    // Body
    ctx.fillStyle = this.flashTimer > 0 ? '#fff' : this.color;
    ctx.beginPath();
    ctx.ellipse(x, y + bob, s * 0.8, s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = Math.max(1, s * 0.15);
    ctx.stroke();

    // Eyes
    const eyeSize = Math.max(1.5, s * 0.2);
    const eyeOffsetX = s * 0.25;
    const eyeY = y + bob - s * 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    const pupilOff = this.facingRight ? 1 : -1;
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX + pupilOff, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffsetX + pupilOff, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Type-specific visuals
    if (this.type === ZombieType.SPRINTER) {
      // Speed lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ly = y + bob - s + i * s * 0.5;
        const dir = this.facingRight ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(x + dir * s, ly);
        ctx.lineTo(x + dir * (s + 8), ly);
        ctx.stroke();
      }
    } else if (this.type === ZombieType.BRUTE) {
      // Bigger, angrier face
      ctx.fillStyle = '#1B5E20';
      ctx.fillRect(x - s * 0.4, y + bob + s * 0.1, s * 0.8, s * 0.15);
    } else if (this.type === ZombieType.ENGINEER) {
      // Hard hat
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(x - s * 0.5, y + bob - s * 1.1, s, s * 0.3);
      ctx.strokeStyle = '#F57F17';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - s * 0.5, y + bob - s * 1.1, s, s * 0.3);
    } else if (this.type === ZombieType.PLANK_CARRIER && this.carriedPlanks) {
      // Planks on back
      ctx.fillStyle = '#8B6914';
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(-0.2);
      ctx.fillRect(-2, -s * 1.5, 4, s * 1.2);
      ctx.fillRect(2, -s * 1.4, 4, s * 1.1);
      ctx.restore();
    }

    // Build progress bar
    if (this.isBuilding) {
      const barW = s * 2;
      const barH = 3;
      const barY = y + bob - s * 1.5;
      const buildTime = this.targetBridge ? this.targetBridge.rebuildTime : 5;
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barW / 2, barY, barW, barH);
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x - barW / 2, barY, barW * (this.buildProgress / buildTime), barH);
    }

    ctx.restore();
  }
}
