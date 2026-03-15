// Drop Dead Keep — Bridge Construction & Destruction

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
    this.planks = [];
    this.constraints = [];
    this.debris = [];

    this.buildPhysics(stats);
  }

  buildPhysics(stats) {
    const plankW = stats.plankWidth * this.scale;
    const plankH = stats.plankHeight * this.scale;
    const count = stats.plankCount;
    const gap = (this.width - plankW) / (count - 1);

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
    this.hp = this.maxHp * (toHpPercent || 0.5);

    // Remove old debris
    for (const d of this.debris) {
      this.physics.removeBody(d);
    }
    this.debris = [];

    // Rebuild physics
    const stats = BRIDGE_STATS[this.type];
    this.buildPhysics(stats);
  }

  getHpPercent() {
    return this.hp / this.maxHp;
  }

  draw(ctx) {
    if (this.destroyed) {
      // Draw broken stubs on each side
      const stubW = 8 * this.scale;
      const stubH = 6 * this.scale;
      ctx.fillStyle = '#555';
      ctx.fillRect(this.x - this.width / 2 - stubW, this.y - stubH / 2, stubW, stubH);
      ctx.fillRect(this.x + this.width / 2, this.y - stubH / 2, stubW, stubH);
      return;
    }

    // Draw intact/damaged bridge
    const stats = BRIDGE_STATS[this.type];
    for (const plank of this.planks) {
      const pw = stats.plankWidth * this.scale;
      const ph = stats.plankHeight * this.scale;
      ctx.save();
      ctx.translate(plank.position.x, plank.position.y);
      ctx.rotate(plank.angle);

      // Plank body
      ctx.fillStyle = this.color;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      // Outline
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5 * this.scale;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

      ctx.restore();
    }

    // Draw ropes/supports
    if (this.type === 'rope') {
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 2 * this.scale;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(this.x - this.width / 2 - 5, this.y - 10 * this.scale);
      ctx.lineTo(this.x + this.width / 2 + 5, this.y - 10 * this.scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // HP bar when damaged
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = this.width * 0.6;
      const barH = 4 * this.scale;
      const barY = this.y - 16 * this.scale;
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x - barW / 2, barY, barW, barH);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#4a4' : pct > 0.25 ? '#aa4' : '#a44';
      ctx.fillRect(this.x - barW / 2, barY, barW * pct, barH);
    }
  }

  drawDebris(ctx) {
    for (const d of this.debris) {
      const stats = BRIDGE_STATS[this.type];
      const pw = stats.plankWidth * this.scale;
      const ph = stats.plankHeight * this.scale;
      ctx.save();
      ctx.translate(d.position.x, d.position.y);
      ctx.rotate(d.angle);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
