// Drop Dead Keep — Gate Defense System
// When zombies reach the wall, player drops oil, rocks, and fire from the battlements

export const DefenseItem = {
  OIL: 'oil',
  ROCKS: 'rocks',
  FIRE: 'fire',
};

const DEFENSE_STATS = {
  oil: { damage: 0, slowFactor: 0.3, radius: 50, duration: 5, color: '#3498db', name: 'OIL' },
  rocks: { damage: 3, slowFactor: 0, radius: 30, duration: 0, color: '#888888', name: 'ROCKS' },
  fire: { damage: 2, slowFactor: 0, radius: 45, duration: 4, color: '#e67e22', name: 'FIRE' },
};

export class GateDefenseSystem {
  constructor() {
    this.active = false;
    this.holdTimer = 0;
    this.holdDuration = 15; // seconds to survive
    this.selectedItem = DefenseItem.ROCKS;

    // Defense item inventory
    this.inventory = {
      oil: 5,
      rocks: 6,
      fire: 3,
    };

    // Active effects on the ground (oil slicks, fires)
    this.activeEffects = [];

    // Zombies visible at the gate (subset managed by wave system)
    this.gateZombies = [];

    // Drop zones — positions where items can be dropped (along the base of the wall)
    this.dropZones = [];

    // Animation state for dropped items
    this.fallingItems = [];

    // Camera zoom transition
    this.zoomProgress = 0;
    this.zoomDuration = 0.8;
  }

  reset() {
    this.active = false;
    this.holdTimer = 0;
    this.selectedItem = DefenseItem.ROCKS;
    this.inventory = { oil: 5, rocks: 6, fire: 3 };
    this.activeEffects = [];
    this.gateZombies = [];
    this.fallingItems = [];
    this.zoomProgress = 0;
  }

  activate(duration) {
    this.active = true;
    this.holdTimer = 0;
    this.holdDuration = duration || 15;
    this.zoomProgress = 0;
    this.activeEffects = [];
    this.fallingItems = [];
    this.gateZombies = [];
  }

  selectItem(item) {
    if (this.inventory[item] > 0) {
      this.selectedItem = item;
    }
  }

  canDrop() {
    return this.inventory[this.selectedItem] > 0;
  }

  dropItem(x, y) {
    if (!this.canDrop()) return null;

    this.inventory[this.selectedItem]--;
    const stats = DEFENSE_STATS[this.selectedItem];
    const item = this.selectedItem;

    // Create a falling animation
    this.fallingItems.push({
      type: item,
      x,
      startY: y - 120, // falls from the wall above
      targetY: y,
      y: y - 120,
      fallTimer: 0,
      fallDuration: 0.4,
    });

    // Auto-switch if out of current item
    if (this.inventory[this.selectedItem] <= 0) {
      for (const key of Object.keys(this.inventory)) {
        if (this.inventory[key] > 0) {
          this.selectedItem = key;
          break;
        }
      }
    }

    return { type: item, stats, x, y };
  }

  update(dt, waveSystem) {
    if (!this.active) return;

    // Zoom-in transition
    if (this.zoomProgress < 1) {
      this.zoomProgress = Math.min(1, this.zoomProgress + dt / this.zoomDuration);
    }

    // Hold timer
    this.holdTimer += dt;

    // Update falling items
    for (let i = this.fallingItems.length - 1; i >= 0; i--) {
      const fi = this.fallingItems[i];
      fi.fallTimer += dt;
      const t = Math.min(fi.fallTimer / fi.fallDuration, 1);
      // Ease-in (accelerating fall)
      const eased = t * t;
      fi.y = fi.startY + (fi.targetY - fi.startY) * eased;

      if (t >= 1) {
        // Item landed — create effect
        this.createEffect(fi.type, fi.x, fi.targetY);
        this.fallingItems.splice(i, 1);
      }
    }

    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.timer += dt;

      // Apply effects to zombies
      if (waveSystem) {
        for (const zombie of waveSystem.zombies) {
          if (!zombie.alive || zombie.falling || zombie.plankState) continue;
          if (!zombie.isInRadius(effect.x, effect.y, effect.radius)) continue;

          if (effect.type === DefenseItem.OIL && !effect.ignited) {
            // Oil slows zombies
            zombie.speed = zombie.baseSpeed * effect.slowFactor;
          } else if (effect.type === DefenseItem.FIRE || effect.ignited) {
            // Fire does damage over time (once per second)
            if (effect.timer - (effect._lastDmgTick || 0) >= 1) {
              effect._lastDmgTick = effect.timer;
              zombie.takeDamage(effect.damage);
            }
          }
        }
      }

      // Remove expired effects
      if (effect.duration > 0 && effect.timer >= effect.duration) {
        // Reset zombie speeds when oil expires
        if (effect.type === DefenseItem.OIL && waveSystem) {
          for (const zombie of waveSystem.zombies) {
            if (zombie.alive) zombie.speed = zombie.baseSpeed;
          }
        }
        this.activeEffects.splice(i, 1);
      }
    }

    // Check if fire is dropped on oil — ignite the oil
    for (const effect of this.activeEffects) {
      if (effect.type !== DefenseItem.OIL || effect.ignited) continue;
      for (const other of this.activeEffects) {
        if (other.type !== DefenseItem.FIRE) continue;
        const dx = effect.x - other.x;
        const dy = effect.y - other.y;
        if (Math.sqrt(dx * dx + dy * dy) < effect.radius + other.radius) {
          effect.ignited = true;
          effect.damage = DEFENSE_STATS.fire.damage + 1; // bonus damage
          effect.color = '#ff4400';
        }
      }
    }
  }

  createEffect(type, x, y) {
    const stats = DEFENSE_STATS[type];

    if (type === DefenseItem.ROCKS) {
      // Rocks do instant damage, no lingering effect
      this._pendingRockImpact = { x, y, damage: stats.damage, radius: stats.radius };
      return;
    }

    this.activeEffects.push({
      type,
      x,
      y,
      radius: stats.radius,
      damage: stats.damage,
      slowFactor: stats.slowFactor,
      duration: stats.duration,
      color: stats.color,
      timer: 0,
      ignited: false,
      _lastDmgTick: 0,
    });
  }

  applyRockImpact(waveSystem) {
    if (!this._pendingRockImpact) return null;
    const rock = this._pendingRockImpact;
    this._pendingRockImpact = null;
    return waveSystem.damageZombiesInRadius(rock.x, rock.y, rock.radius, rock.damage);
  }

  isHoldComplete() {
    return this.holdTimer >= this.holdDuration;
  }

  getHoldTimeRemaining() {
    return Math.max(0, this.holdDuration - this.holdTimer);
  }

  getHoldProgress() {
    return Math.min(1, this.holdTimer / this.holdDuration);
  }

  hasAnyItems() {
    return Object.values(this.inventory).some(v => v > 0);
  }

  getSelectedStats() {
    return DEFENSE_STATS[this.selectedItem];
  }

  // Get the zoomed-in view bounds for the gate defense camera
  getViewBounds(gameSize, castleY) {
    const viewHeight = gameSize * 0.45;
    const viewTop = castleY - viewHeight + 40;
    return {
      x: 0,
      y: viewTop,
      width: gameSize,
      height: viewHeight,
      centerX: gameSize / 2,
      centerY: castleY - viewHeight / 2 + 40,
    };
  }

  draw(ctx, gameSize, castleY, waveSystem) {
    if (!this.active) return;

    const eased = this.easeInOutCubic(this.zoomProgress);
    const bounds = this.getViewBounds(gameSize, castleY);

    // During zoom transition, calculate intermediate values
    const zoom = 1 + eased * 1.2; // zoom from 1x to 2.2x
    const panY = eased * (bounds.centerY - gameSize / 2);

    ctx.save();

    // Apply zoom centered on gate area
    ctx.translate(gameSize / 2, gameSize / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-gameSize / 2, -gameSize / 2 - panY);

    // Draw active effects (oil slicks, fire patches)
    for (const effect of this.activeEffects) {
      this.drawEffect(ctx, effect);
    }

    // Draw falling items
    for (const fi of this.fallingItems) {
      this.drawFallingItem(ctx, fi);
    }

    ctx.restore();

    // Draw targeting reticle at mouse position (drawn in screen space by HUD)
  }

  drawEffect(ctx, effect) {
    ctx.save();
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;

    if (effect.type === DefenseItem.OIL && !effect.ignited) {
      // Blue-tinted oil puddle
      ctx.globalAlpha = 0.4 * pulse;
      ctx.fillStyle = '#2980b9';
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius, effect.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sheen
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#5dade2';
      ctx.beginPath();
      ctx.ellipse(effect.x - 5, effect.y - 3, effect.radius * 0.4, effect.radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === DefenseItem.FIRE || effect.ignited) {
      // Fire effect — flickering orange/red
      const flicker = Math.random() * 0.3;
      ctx.globalAlpha = (0.5 + flicker) * pulse;
      ctx.fillStyle = effect.ignited ? '#ff4400' : '#e67e22';
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius, effect.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow
      ctx.globalAlpha = 0.4 + flicker;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * 0.5, effect.radius * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawFallingItem(ctx, fi) {
    ctx.save();
    const stats = DEFENSE_STATS[fi.type];
    const size = 8;

    if (fi.type === DefenseItem.OIL) {
      // Blue barrel
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(fi.x - size - 1, fi.y - size - 1, size * 2 + 2, size * 2 + 2);
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(fi.x - size, fi.y - size, size * 2, size * 2);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(fi.x - size + 2, fi.y - size + 2, size - 2, size * 2 - 4);
    } else if (fi.type === DefenseItem.ROCKS) {
      // Gray rocks cluster
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(fi.x, fi.y, size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(fi.x, fi.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.arc(fi.x - 2, fi.y - 2, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (fi.type === DefenseItem.FIRE) {
      // Fire pot
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(fi.x - size - 1, fi.y - size - 1, size * 2 + 2, size * 2 + 2);
      ctx.fillStyle = '#cc4400';
      ctx.fillRect(fi.x - size, fi.y - size, size * 2, size * 2);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(fi.x - size / 2, fi.y - size, size, size);
    }

    // Drop shadow grows as item falls
    const t = fi.fallTimer / fi.fallDuration;
    ctx.globalAlpha = 0.3 * t;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(fi.x, fi.targetY + 4, size * t, size * 0.3 * t, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
