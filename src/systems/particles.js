// Drop Dead Keep — Particle System

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, options = {}) {
    for (let i = 0; i < count; i++) {
      const angle = options.angle !== undefined
        ? options.angle + (Math.random() - 0.5) * (options.spread || Math.PI)
        : Math.random() * Math.PI * 2;
      const speed = (options.speed || 80) * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (options.gravity ? -50 : 0),
        size: (options.size || 3) * (0.5 + Math.random() * 0.5),
        color: options.color || '#aaa',
        life: 0,
        maxLife: (options.lifetime || 0.8) * (0.5 + Math.random() * 0.5),
        gravity: options.gravity || 0,
        friction: options.friction || 0.98,
      });
    }
  }

  emitDust(x, y, scale) {
    this.emit(x, y, 6, {
      color: 'rgba(180, 160, 120, 0.6)',
      speed: 40 * scale,
      size: 4 * scale,
      lifetime: 0.6,
      gravity: 100,
    });
  }

  emitSplinters(x, y, scale) {
    this.emit(x, y, 8, {
      color: '#8B6914',
      speed: 100 * scale,
      size: 3 * scale,
      lifetime: 0.8,
      gravity: 200,
    });
  }

  emitImpact(x, y, scale) {
    this.emit(x, y, 12, {
      color: '#aaa',
      speed: 60 * scale,
      size: 3 * scale,
      lifetime: 0.5,
      gravity: 150,
    });
  }

  update(dt) {
    for (const p of this.particles) {
      p.life += dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter(p => p.life < p.maxLife);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      const quantizedSize = Math.max(2, Math.round(p.size / 2) * 2);
      const px = Math.round(p.x) - quantizedSize / 2;
      const py = Math.round(p.y) - quantizedSize / 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, quantizedSize, quantizedSize);
    }
    ctx.globalAlpha = 1;
  }
}
