// Drop Dead Keep — Gate Defense System
// When zombies reach the wall, player drops oil, rocks, and fire from the battlements
// View: looking straight down over the castle wall at zombies banging on the gate

import { getSprites } from '../sprites/pixel-data.js';
import { drawSpriteAt, drawTiledSprite, setupPixelCanvas } from '../sprites/sprite-renderer.js';

export const DefenseItem = {
  OIL: 'oil',
  ROCKS: 'rocks',
  FIRE: 'fire',
};

// Explicit priority order for auto-switching when current item runs out
const ITEM_PRIORITY = [DefenseItem.ROCKS, DefenseItem.OIL, DefenseItem.FIRE];

const DEFENSE_STATS = {
  oil: { damage: 0, slowFactor: 0.3, radius: 50, duration: 5, color: '#3498db' },
  rocks: { damage: 3, slowFactor: 0, radius: 30, duration: 0, color: '#888888' },
  fire: { damage: 2, slowFactor: 0, radius: 45, duration: 4, color: '#e67e22' },
};

const ATTACKER_HIT_PADDING = 15;

// Scene layout constants (800x800 game space)
const SCENE = {
  WALL_TOP: 140,
  WALL_BOTTOM: 200,
  GATE_X: 400,
  GATE_WIDTH: 100,
  GATE_Y: 200,
  GATE_HEIGHT: 80,
  DROP_TOP: 200,
  DROP_BOTTOM: 700,
  ZOMBIE_MIN_Y: 240,
  ZOMBIE_MAX_Y: 550,
};

const TORCH_POSITIONS = [80, 250, 550, 720];

export class GateDefenseSystem {
  constructor() {
    this.transitionDuration = 0.6;
    this._sortedAttackers = [];
    this._cachedGradients = null;
    this.reset();
  }

  reset() {
    this.active = false;
    this.holdTimer = 0;
    this.holdDuration = 15;
    this.selectedItem = DefenseItem.ROCKS;
    this.inventory = { oil: 5, rocks: 6, fire: 3 };
    this.activeEffects = [];
    this.fallingItems = [];
    this._pendingRockImpacts = [];
    this.attackers = [];
    this.transitionTimer = 0;
  }

  activate(duration, zombieCount) {
    this.reset();
    this.active = true;
    this.holdDuration = duration || 15;

    // Spawn visual gate attackers clustered around the gate
    const count = zombieCount || 8;
    for (let i = 0; i < count; i++) {
      this.attackers.push(this._spawnAttacker());
    }
  }

  _spawnAttacker() {
    const gx = SCENE.GATE_X;
    const spread = 160;
    const types = ['shambler', 'shambler', 'shambler', 'sprinter', 'brute', 'engineer'];
    return {
      x: gx + (Math.random() - 0.5) * spread,
      y: SCENE.GATE_Y + SCENE.GATE_HEIGHT / 2 + 20 + Math.random() * 120,
      type: types[Math.floor(Math.random() * types.length)],
      hp: 3,
      alive: true,
      phase: Math.random() * Math.PI * 2,
      bangTimer: Math.random() * 2,
      bangCooldown: 1.5 + Math.random(),
      isBanging: false,
      slowFactor: 1,
    };
  }

  deactivate() {
    this.active = false;
  }

  selectItem(item) {
    if (this.inventory[item] > 0) {
      this.selectedItem = item;
    }
  }

  canDrop() {
    return this.inventory[this.selectedItem] > 0;
  }

  isInDropZone(x, y) {
    return y > SCENE.DROP_TOP && y < SCENE.DROP_BOTTOM && x > 30 && x < 770;
  }

  dropItem(x, y) {
    if (!this.canDrop()) return null;

    this.inventory[this.selectedItem]--;
    const stats = DEFENSE_STATS[this.selectedItem];
    const item = this.selectedItem;

    this.fallingItems.push({
      type: item,
      x,
      startY: SCENE.WALL_BOTTOM - 30,
      targetY: y,
      y: SCENE.WALL_BOTTOM - 30,
      fallTimer: 0,
      fallDuration: 0.35,
    });

    // Auto-switch if out of current item
    if (this.inventory[this.selectedItem] <= 0) {
      for (const key of ITEM_PRIORITY) {
        if (this.inventory[key] > 0) {
          this.selectedItem = key;
          break;
        }
      }
    }

    return { type: item, stats, x, y };
  }

  _damageAttackersInRadius(x, y, radius, damage) {
    const thresholdSq = (radius + ATTACKER_HIT_PADDING) * (radius + ATTACKER_HIT_PADDING);
    for (const atk of this.attackers) {
      if (!atk.alive) continue;
      const dx = atk.x - x;
      const dy = atk.y - y;
      if (dx * dx + dy * dy < thresholdSq) {
        atk.hp -= damage;
        if (atk.hp <= 0) atk.alive = false;
      }
    }
  }

  update(dt) {
    if (!this.active) return;

    // Transition
    if (this.transitionTimer < this.transitionDuration) {
      this.transitionTimer = Math.min(this.transitionDuration, this.transitionTimer + dt);
    }

    // Hold timer
    this.holdTimer += dt;

    // Update falling items
    for (let i = this.fallingItems.length - 1; i >= 0; i--) {
      const fi = this.fallingItems[i];
      fi.fallTimer += dt;
      const t = Math.min(fi.fallTimer / fi.fallDuration, 1);
      fi.y = fi.startY + (fi.targetY - fi.startY) * t * t;

      if (t >= 1) {
        this.createEffect(fi.type, fi.x, fi.targetY);
        this.fallingItems[i] = this.fallingItems[this.fallingItems.length - 1];
        this.fallingItems.pop();
      }
    }

    // Reset attacker slow factors, then re-apply from active effects
    for (const atk of this.attackers) {
      if (atk.alive) atk.slowFactor = 1;
    }

    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.timer += dt;

      // Apply effects to attackers
      const thresholdSq = (effect.radius + ATTACKER_HIT_PADDING) * (effect.radius + ATTACKER_HIT_PADDING);
      for (const atk of this.attackers) {
        if (!atk.alive) continue;
        const dx = atk.x - effect.x;
        const dy = atk.y - effect.y;
        if (dx * dx + dy * dy > thresholdSq) continue;

        if (effect.type === DefenseItem.OIL && !effect.ignited) {
          atk.slowFactor = Math.min(atk.slowFactor, effect.slowFactor);
        } else if (effect.type === DefenseItem.FIRE || effect.ignited) {
          if (effect.timer - effect._lastDmgTick >= 1) {
            effect._lastDmgTick = effect.timer;
            atk.hp -= effect.damage;
            if (atk.hp <= 0) atk.alive = false;
          }
        }
      }

      // Remove expired effects
      if (effect.duration > 0 && effect.timer >= effect.duration) {
        this.activeEffects[i] = this.activeEffects[this.activeEffects.length - 1];
        this.activeEffects.pop();
      }
    }

    // Oil + fire ignition (squared distance)
    for (const effect of this.activeEffects) {
      if (effect.type !== DefenseItem.OIL || effect.ignited) continue;
      for (const other of this.activeEffects) {
        if (other.type !== DefenseItem.FIRE) continue;
        const dx = effect.x - other.x;
        const dy = effect.y - other.y;
        const threshold = effect.radius + other.radius;
        if (dx * dx + dy * dy < threshold * threshold) {
          effect.ignited = true;
          effect.damage = DEFENSE_STATS.fire.damage + 1;
          effect.color = '#ff4400';
        }
      }
    }

    // Update gate attackers — simple animation
    for (const atk of this.attackers) {
      if (!atk.alive) continue;
      atk.phase += dt * 3 * atk.slowFactor;
      atk.bangTimer -= dt * atk.slowFactor;
      if (atk.bangTimer <= 0) {
        atk.isBanging = true;
        atk.bangTimer = atk.bangCooldown;
        atk.y += (SCENE.GATE_Y + SCENE.GATE_HEIGHT / 2 - atk.y) * 0.05;
        atk.x += (SCENE.GATE_X - atk.x) * 0.02;
      } else if (atk.bangTimer > atk.bangCooldown - 0.2) {
        atk.isBanging = true;
      } else {
        atk.isBanging = false;
      }
      atk.x += Math.sin(atk.phase * 0.7) * 0.3;
      atk.y += Math.cos(atk.phase * 0.5) * 0.15;
    }

    // Periodically spawn new attackers if some were killed
    let alive = 0;
    for (const a of this.attackers) if (a.alive) alive++;
    if (alive < 4 && Math.random() < dt * 0.5) {
      const newAtk = this._spawnAttacker();
      newAtk.y = SCENE.DROP_BOTTOM - 30;
      this.attackers.push(newAtk);
    }

    // Clean up dead attackers (keep list bounded)
    if (this.attackers.length > 20) {
      let write = 0;
      for (let read = 0; read < this.attackers.length; read++) {
        if (this.attackers[read].alive) {
          this.attackers[write++] = this.attackers[read];
        }
      }
      this.attackers.length = write;
    }
  }

  createEffect(type, x, y) {
    const stats = DEFENSE_STATS[type];

    if (type === DefenseItem.ROCKS) {
      this._pendingRockImpacts.push({ x, y, damage: stats.damage, radius: stats.radius });
      this._damageAttackersInRadius(x, y, stats.radius, stats.damage);
      return;
    }

    this.activeEffects.push({
      ...stats, type, x, y,
      timer: 0,
      ignited: false,
      _lastDmgTick: 0,
    });
  }

  applyRockImpacts(waveSystem) {
    if (this._pendingRockImpacts.length === 0) return 0;
    let totalKills = 0;
    for (const rock of this._pendingRockImpacts) {
      totalKills += waveSystem.damageZombiesInRadius(rock.x, rock.y, rock.radius, rock.damage) || 0;
    }
    this._pendingRockImpacts = [];
    return totalKills;
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

  // ========== DRAWING — Full scene ==========

  drawScene(ctx, gameSize) {
    setupPixelCanvas(ctx);
    const sprites = getSprites();
    const t = Math.min(1, this.transitionTimer / this.transitionDuration);
    const now = Date.now();

    ctx.save();
    ctx.globalAlpha = t;

    this._drawGround(ctx, gameSize, sprites);
    this._drawGate(ctx);

    for (const effect of this.activeEffects) {
      this._drawEffect(ctx, effect, now);
    }

    for (const fi of this.fallingItems) {
      this._drawFallingItem(ctx, fi, sprites);
    }

    // Sort alive attackers for depth (reuse array to avoid GC)
    this._sortedAttackers.length = 0;
    for (const a of this.attackers) {
      if (a.alive) this._sortedAttackers.push(a);
    }
    this._sortedAttackers.sort((a, b) => a.y - b.y);
    for (const atk of this._sortedAttackers) {
      this._drawAttacker(ctx, atk);
    }

    this._drawWall(ctx, gameSize, sprites, now);

    ctx.restore();
  }

  _drawGround(ctx, gameSize, sprites) {
    const groundColors = ['#2a2820', '#252318', '#201e15', '#1c1a12', '#181610'];
    const bandH = (SCENE.DROP_BOTTOM - SCENE.DROP_TOP) / groundColors.length;
    for (let i = 0; i < groundColors.length; i++) {
      ctx.fillStyle = groundColors[i];
      ctx.fillRect(0, SCENE.DROP_TOP + i * bandH, gameSize, bandH + 1);
    }

    const pathW = 80;
    const pathX = SCENE.GATE_X - pathW / 2;
    if (sprites.env.pathTile) {
      drawTiledSprite(ctx, sprites.env.pathTile, pathX, SCENE.DROP_TOP, pathW, SCENE.DROP_BOTTOM - SCENE.DROP_TOP, 2);
    }

    if (sprites.env.grassTile) {
      for (let y = SCENE.DROP_TOP + 20; y < SCENE.DROP_BOTTOM - 20; y += 30) {
        drawSpriteAt(ctx, sprites.env.grassTile, pathX - 12, y, 1.5);
        drawSpriteAt(ctx, sprites.env.grassTile, pathX + pathW, y, 1.5);
      }
    }

    ctx.fillStyle = 'rgba(60, 40, 20, 0.3)';
    ctx.beginPath();
    ctx.ellipse(SCENE.GATE_X, SCENE.GATE_Y + SCENE.GATE_HEIGHT + 30, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, SCENE.DROP_BOTTOM, gameSize, gameSize - SCENE.DROP_BOTTOM);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, gameSize, SCENE.WALL_TOP);
    ctx.fillStyle = '#222222';
    for (let x = 0; x < gameSize; x += 20) {
      for (let y = 0; y < SCENE.WALL_TOP; y += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 18, 18);
        }
      }
    }
  }

  _ensureGradients(ctx, gameSize) {
    if (this._cachedGradients) return this._cachedGradients;

    const wallY = SCENE.WALL_TOP;
    const wallH = SCENE.WALL_BOTTOM - SCENE.WALL_TOP;
    const wallCenterY = wallY + wallH / 2;

    const torchGlows = TORCH_POSITIONS.map(tx => {
      const grd = ctx.createRadialGradient(tx, wallCenterY, 0, tx, wallCenterY, 40);
      grd.addColorStop(0, '#ff8800');
      grd.addColorStop(1, 'transparent');
      return grd;
    });

    const shadowGrd = ctx.createLinearGradient(0, SCENE.WALL_BOTTOM, 0, SCENE.WALL_BOTTOM + 50);
    shadowGrd.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    shadowGrd.addColorStop(1, 'transparent');

    this._cachedGradients = { torchGlows, shadowGrd };
    return this._cachedGradients;
  }

  _drawWall(ctx, gameSize, sprites, now) {
    const wallY = SCENE.WALL_TOP;
    const wallH = SCENE.WALL_BOTTOM - SCENE.WALL_TOP;

    if (sprites.castle.wallTile) {
      drawTiledSprite(ctx, sprites.castle.wallTile, 0, wallY, gameSize, wallH, 3);
    } else {
      ctx.fillStyle = '#6a6a5a';
      ctx.fillRect(0, wallY, gameSize, wallH);
    }

    ctx.fillStyle = '#0a0514';
    ctx.fillRect(SCENE.GATE_X - SCENE.GATE_WIDTH / 2, wallY, SCENE.GATE_WIDTH, wallH);

    if (sprites.castle.merlon) {
      const merlonW = sprites.castle.merlon.width * 3;
      const merlonCount = Math.floor(gameSize / (merlonW + 6));
      const spacing = gameSize / merlonCount;
      for (let i = 0; i < merlonCount; i++) {
        const mx = i * spacing + (spacing - merlonW) / 2;
        const my = SCENE.WALL_BOTTOM - 4;
        if (mx + merlonW > SCENE.GATE_X - SCENE.GATE_WIDTH / 2 - 10 &&
            mx < SCENE.GATE_X + SCENE.GATE_WIDTH / 2 + 10) continue;
        drawSpriteAt(ctx, sprites.castle.merlon, mx, my, 3);
      }
    }

    ctx.fillStyle = '#3a3a30';
    ctx.fillRect(0, wallY, gameSize, 4);

    // Torches with cached gradients
    const torchSprite = sprites.castle.torch[Math.floor(now / 300) % 2];
    if (torchSprite) {
      const gradients = this._ensureGradients(ctx, gameSize);
      for (let i = 0; i < TORCH_POSITIONS.length; i++) {
        const tx = TORCH_POSITIONS[i];
        drawSpriteAt(ctx, torchSprite, tx - 8, wallY + wallH / 2 - 10, 2.5);
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(now * 0.003 + tx) * 0.05;
        ctx.fillStyle = gradients.torchGlows[i];
        ctx.fillRect(tx - 40, wallY - 10, 80, wallH + 20);
        ctx.restore();
      }
    }

    // Wall shadow
    ctx.save();
    const gradients = this._ensureGradients(ctx, gameSize);
    ctx.fillStyle = gradients.shadowGrd;
    ctx.fillRect(0, SCENE.WALL_BOTTOM, gameSize, 50);
    ctx.restore();
  }

  _drawGate(ctx) {
    const gx = SCENE.GATE_X;
    const gw = SCENE.GATE_WIDTH;
    const gy = SCENE.GATE_Y;
    const gh = SCENE.GATE_HEIGHT;

    ctx.fillStyle = '#4a4a40';
    ctx.fillRect(gx - gw / 2 - 8, gy, 8, gh);
    ctx.fillRect(gx + gw / 2, gy, 8, gh);

    ctx.fillStyle = '#2a2820';
    ctx.fillRect(gx - gw / 2, gy, gw, gh);

    ctx.strokeStyle = '#808078';
    ctx.lineWidth = 3;
    for (let x = gx - gw / 2 + 10; x < gx + gw / 2; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 2);
      ctx.lineTo(x, gy + gh - 2);
      ctx.stroke();
    }
    for (let y = gy + 12; y < gy + gh; y += 16) {
      ctx.beginPath();
      ctx.moveTo(gx - gw / 2 + 4, y);
      ctx.lineTo(gx + gw / 2 - 4, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#808078';
    for (let x = gx - gw / 2 + 8; x < gx + gw / 2; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x - 3, gy + gh);
      ctx.lineTo(x + 3, gy + gh);
      ctx.lineTo(x, gy + gh + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawEffect(ctx, effect, now) {
    ctx.save();
    const pulse = 0.8 + Math.sin(now * 0.005) * 0.2;

    if (effect.type === DefenseItem.OIL && !effect.ignited) {
      ctx.globalAlpha = 0.5 * pulse;
      ctx.fillStyle = '#1a3a5a';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(effect.x - 8, effect.y - 5, effect.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === DefenseItem.FIRE || effect.ignited) {
      // Deterministic flicker based on time and position
      const flicker = (Math.sin(now * 0.017 + effect.x * 7.3) * 0.5 + 0.5) * 0.3;
      ctx.globalAlpha = (0.6 + flicker) * pulse;
      ctx.fillStyle = effect.ignited ? '#ff4400' : '#e67e22';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5 + flicker;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Sparks
      ctx.fillStyle = '#ff6600';
      for (let i = 0; i < 3; i++) {
        const angle = now * 0.01 + i * 2.1;
        const r = effect.radius * (0.5 + (Math.sin(now * 0.013 + i * 3.7 + effect.y) * 0.5 + 0.5) * 0.4);
        ctx.globalAlpha = 0.5 + (Math.sin(now * 0.011 + i * 5.1) * 0.5 + 0.5) * 0.5;
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(angle) * r, effect.y + Math.sin(angle) * r, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  _drawFallingItem(ctx, fi, sprites) {
    ctx.save();
    const sprite = sprites.defense[fi.type];
    const t = fi.fallTimer / fi.fallDuration;

    ctx.globalAlpha = 0.4 * t;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(fi.x, fi.targetY, 10 * t + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    const scale = 2 + t * 1.5;
    if (sprite) {
      drawSpriteAt(ctx, sprite, fi.x - sprite.width * scale / 2, fi.y - sprite.height * scale / 2, scale);
    }

    ctx.restore();
  }

  _drawAttacker(ctx, atk) {
    if (!atk.alive) return;
    ctx.save();

    const bob = Math.sin(atk.phase) * 2;
    const bangOffset = atk.isBanging ? -4 : 0;

    const x = atk.x + bob;
    const y = atk.y + bangOffset;
    const size = atk.type === 'brute' ? 14 : 10;

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, size + 2, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const bodyColor = atk.type === 'brute' ? '#2E7D32' : '#3a7a2a';
    const headColor = atk.type === 'brute' ? '#388E3C' : '#5cb54c';

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(x, y, size + 1, size * 0.75 + 1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.5 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, y - size * 0.5, 2, 0, Math.PI * 2);
    ctx.arc(x + 3, y - size * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(x - 3, y - size * 0.55, 1, 0, Math.PI * 2);
    ctx.arc(x + 3, y - size * 0.55, 1, 0, Math.PI * 2);
    ctx.fill();

    if (atk.isBanging) {
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 2);
      ctx.lineTo(x - 8, y - size - 4);
      ctx.moveTo(x + 6, y - 2);
      ctx.lineTo(x + 8, y - size - 4);
      ctx.stroke();
    }

    if (atk.type === 'engineer') {
      ctx.fillStyle = '#d4c832';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.45, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (atk.slowFactor < 1) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.ellipse(x, y, size + 2, size * 0.75 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
