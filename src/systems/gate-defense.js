// Drop Dead Keep — Gate Defense System
// When zombies reach the wall, player drops oil, rocks, and fire from the battlements
// View: looking straight down over the castle wall at zombies banging on the gate

import { getSprites } from '../sprites/pixel-data.js';
import { drawSpriteAt, drawTiledSprite, drawSprite, setupPixelCanvas } from '../sprites/sprite-renderer.js';
import { drawPixelText, drawPixelBox, drawPixelBar } from '../sprites/pixel-font.js';

export const DefenseItem = {
  OIL: 'oil',
  ROCKS: 'rocks',
  FIRE: 'fire',
};

// Explicit priority order for auto-switching when current item runs out
const ITEM_PRIORITY = [DefenseItem.ROCKS, DefenseItem.OIL, DefenseItem.FIRE];

const DEFENSE_STATS = {
  oil: { damage: 0, slowFactor: 0.3, radius: 50, duration: 5, color: '#3498db', name: 'OIL' },
  rocks: { damage: 3, slowFactor: 0, radius: 30, duration: 0, color: '#888888', name: 'ROCKS' },
  fire: { damage: 2, slowFactor: 0, radius: 45, duration: 4, color: '#e67e22', name: 'FIRE' },
};

// Scene layout constants (800x800 game space)
const SCENE = {
  // Wall runs across the screen at this Y — everything above is "inside" the castle
  WALL_TOP: 140,       // top of the wall (battlements)
  WALL_BOTTOM: 200,    // base of the wall (where things drop from)
  // Gate opening in the center of the wall
  GATE_X: 400,
  GATE_WIDTH: 100,
  GATE_Y: 200,         // gate is at the base of the wall
  GATE_HEIGHT: 80,     // extends below wall
  // Drop zone: the ground area below the wall where zombies cluster
  DROP_TOP: 200,       // just below the wall
  DROP_BOTTOM: 700,    // bottom of the drop zone (before HUD)
  // Zombie spawn band — they cluster around the gate
  ZOMBIE_MIN_Y: 240,
  ZOMBIE_MAX_Y: 550,
};

export class GateDefenseSystem {
  constructor() {
    this.active = false;
    this.holdTimer = 0;
    this.holdDuration = 15;
    this.selectedItem = DefenseItem.ROCKS;
    this.inventory = { oil: 5, rocks: 6, fire: 3 };
    this.activeEffects = [];
    this.fallingItems = [];
    this._pendingRockImpacts = [];

    // Gate attackers — visual zombies at the gate (managed independently)
    this.attackers = [];

    // Transition
    this.transitionTimer = 0;
    this.transitionDuration = 0.6;
  }

  reset() {
    this.active = false;
    this.holdTimer = 0;
    this.selectedItem = DefenseItem.ROCKS;
    this.inventory = { oil: 5, rocks: 6, fire: 3 };
    this.activeEffects = [];
    this.fallingItems = [];
    this._pendingRockImpacts = [];
    this.attackers = [];
    this.transitionTimer = 0;
  }

  activate(duration, zombieCount) {
    this.active = true;
    this.holdTimer = 0;
    this.holdDuration = duration || 15;
    this.activeEffects = [];
    this.fallingItems = [];
    this._pendingRockImpacts = [];
    this.transitionTimer = 0;

    // Spawn visual gate attackers clustered around the gate
    this.attackers = [];
    const count = zombieCount || 8;
    for (let i = 0; i < count; i++) {
      this.attackers.push(this._spawnAttacker());
    }
  }

  _spawnAttacker() {
    // Cluster around the gate, with some spread
    const gx = SCENE.GATE_X;
    const spread = 160;
    const types = ['shambler', 'shambler', 'shambler', 'sprinter', 'brute', 'engineer'];
    return {
      x: gx + (Math.random() - 0.5) * spread,
      y: SCENE.GATE_Y + SCENE.GATE_HEIGHT / 2 + 20 + Math.random() * 120,
      type: types[Math.floor(Math.random() * types.length)],
      hp: 3,
      alive: true,
      phase: Math.random() * Math.PI * 2,   // animation offset
      bangTimer: Math.random() * 2,          // time until next bang
      bangCooldown: 1.5 + Math.random(),     // how often they bang
      isBanging: false,
      slowFactor: 1,
    };
  }

  deactivate(waveSystem) {
    this.active = false;
    if (waveSystem) {
      for (const zombie of waveSystem.zombies) {
        if (zombie.alive) zombie.speed = zombie.baseSpeed;
      }
    }
  }

  selectItem(item) {
    if (this.inventory[item] > 0) {
      this.selectedItem = item;
    }
  }

  canDrop() {
    return this.inventory[this.selectedItem] > 0;
  }

  // Check if a position is in the valid drop zone (below the wall, above HUD)
  isInDropZone(x, y) {
    return y > SCENE.DROP_TOP && y < SCENE.DROP_BOTTOM && x > 30 && x < 770;
  }

  dropItem(x, y) {
    if (!this.canDrop()) return null;

    this.inventory[this.selectedItem]--;
    const stats = DEFENSE_STATS[this.selectedItem];
    const item = this.selectedItem;

    // Falling animation: item drops from the wall above
    this.fallingItems.push({
      type: item,
      x,
      startY: SCENE.WALL_BOTTOM - 30,  // starts at the wall edge
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
      const eased = t * t; // accelerating fall
      fi.y = fi.startY + (fi.targetY - fi.startY) * eased;

      if (t >= 1) {
        this.createEffect(fi.type, fi.x, fi.targetY);
        this.fallingItems.splice(i, 1);
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
      for (const atk of this.attackers) {
        if (!atk.alive) continue;
        const dx = atk.x - effect.x;
        const dy = atk.y - effect.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > effect.radius + 15) continue;

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
        this.activeEffects.splice(i, 1);
      }
    }

    // Oil + fire ignition
    for (const effect of this.activeEffects) {
      if (effect.type !== DefenseItem.OIL || effect.ignited) continue;
      for (const other of this.activeEffects) {
        if (other.type !== DefenseItem.FIRE) continue;
        const dx = effect.x - other.x;
        const dy = effect.y - other.y;
        if (Math.sqrt(dx * dx + dy * dy) < effect.radius + other.radius) {
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
        // Move slightly toward gate when banging
        atk.y += (SCENE.GATE_Y + SCENE.GATE_HEIGHT / 2 - atk.y) * 0.05;
        atk.x += (SCENE.GATE_X - atk.x) * 0.02;
      } else if (atk.bangTimer > atk.bangCooldown - 0.2) {
        atk.isBanging = true;
      } else {
        atk.isBanging = false;
      }
      // Small wander
      atk.x += Math.sin(atk.phase * 0.7) * 0.3;
      atk.y += Math.cos(atk.phase * 0.5) * 0.15;
    }

    // Periodically spawn new attackers if some were killed (representing more zombies arriving)
    const alive = this.attackers.filter(a => a.alive).length;
    if (alive < 4 && Math.random() < dt * 0.5) {
      const newAtk = this._spawnAttacker();
      // Spawn from the bottom of the scene, walking up
      newAtk.y = SCENE.DROP_BOTTOM - 30;
      this.attackers.push(newAtk);
    }

    // Clean up very dead attackers (keep list bounded)
    if (this.attackers.length > 20) {
      this.attackers = this.attackers.filter(a => a.alive);
    }
  }

  createEffect(type, x, y) {
    const stats = DEFENSE_STATS[type];

    if (type === DefenseItem.ROCKS) {
      this._pendingRockImpacts.push({ x, y, damage: stats.damage, radius: stats.radius });
      // Direct damage to attackers
      for (const atk of this.attackers) {
        if (!atk.alive) continue;
        const dx = atk.x - x;
        const dy = atk.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < stats.radius + 15) {
          atk.hp -= stats.damage;
          if (atk.hp <= 0) atk.alive = false;
        }
      }
      return;
    }

    this.activeEffects.push({
      type, x, y,
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

    // Fade in
    ctx.save();
    ctx.globalAlpha = t;

    // 1. Ground below the wall — dirt/dark earth
    this._drawGround(ctx, gameSize, sprites);

    // 2. Gate (portcullis) — seen from above, in the wall opening
    this._drawGate(ctx, sprites);

    // 3. Active ground effects (oil puddles, fire)
    for (const effect of this.activeEffects) {
      this._drawEffect(ctx, effect);
    }

    // 4. Falling items
    for (const fi of this.fallingItems) {
      this._drawFallingItem(ctx, fi, sprites);
    }

    // 5. Zombie attackers (sorted by Y for depth)
    const sorted = [...this.attackers].filter(a => a.alive).sort((a, b) => a.y - b.y);
    for (const atk of sorted) {
      this._drawAttacker(ctx, atk, sprites);
    }

    // 6. Castle wall — drawn ON TOP of everything (we're looking down from behind it)
    this._drawWall(ctx, gameSize, sprites);

    // 7. Rock impact debris (brief visual)
    // (handled by falling items landing)

    ctx.restore();
  }

  _drawGround(ctx, gameSize, sprites) {
    // Dark earth below the wall
    const groundColors = ['#2a2820', '#252318', '#201e15', '#1c1a12', '#181610'];
    const bandH = (SCENE.DROP_BOTTOM - SCENE.DROP_TOP) / groundColors.length;
    for (let i = 0; i < groundColors.length; i++) {
      ctx.fillStyle = groundColors[i];
      ctx.fillRect(0, SCENE.DROP_TOP + i * bandH, gameSize, bandH + 1);
    }

    // Path leading away from the gate (vertical strip)
    const pathW = 80;
    const pathX = SCENE.GATE_X - pathW / 2;
    if (sprites.env.pathTile) {
      drawTiledSprite(ctx, sprites.env.pathTile, pathX, SCENE.DROP_TOP, pathW, SCENE.DROP_BOTTOM - SCENE.DROP_TOP, 2);
    }

    // Grass tufts along path edges
    if (sprites.env.grassTile) {
      for (let y = SCENE.DROP_TOP + 20; y < SCENE.DROP_BOTTOM - 20; y += 30) {
        drawSpriteAt(ctx, sprites.env.grassTile, pathX - 12, y, 1.5);
        drawSpriteAt(ctx, sprites.env.grassTile, pathX + pathW, y, 1.5);
      }
    }

    // Splatter/debris near gate
    ctx.fillStyle = 'rgba(60, 40, 20, 0.3)';
    ctx.beginPath();
    ctx.ellipse(SCENE.GATE_X, SCENE.GATE_Y + SCENE.GATE_HEIGHT + 30, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Night sky at very bottom (below ground)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, SCENE.DROP_BOTTOM, gameSize, gameSize - SCENE.DROP_BOTTOM);

    // Castle interior at top (dark stone floor)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, gameSize, SCENE.WALL_TOP);
    // Slightly lighter stone texture
    ctx.fillStyle = '#222222';
    for (let x = 0; x < gameSize; x += 20) {
      for (let y = 0; y < SCENE.WALL_TOP; y += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 18, 18);
        }
      }
    }
  }

  _drawWall(ctx, gameSize, sprites) {
    const wallY = SCENE.WALL_TOP;
    const wallH = SCENE.WALL_BOTTOM - SCENE.WALL_TOP;

    // Main wall body — tiled stone
    if (sprites.castle.wallTile) {
      drawTiledSprite(ctx, sprites.castle.wallTile, 0, wallY, gameSize, wallH, 3);
    } else {
      ctx.fillStyle = '#6a6a5a';
      ctx.fillRect(0, wallY, gameSize, wallH);
    }

    // Gate opening — cut out the wall where the gate is
    // Draw the gate opening shadow
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(SCENE.GATE_X - SCENE.GATE_WIDTH / 2, wallY, SCENE.GATE_WIDTH, wallH);

    // Merlons (battlements) along the OUTER edge (bottom of the wall from our POV)
    if (sprites.castle.merlon) {
      const merlonW = sprites.castle.merlon.width * 3;
      const merlonH = sprites.castle.merlon.height * 3;
      const merlonCount = Math.floor(gameSize / (merlonW + 6));
      const spacing = gameSize / merlonCount;
      for (let i = 0; i < merlonCount; i++) {
        const mx = i * spacing + (spacing - merlonW) / 2;
        const my = SCENE.WALL_BOTTOM - 4;
        // Skip merlons over the gate opening
        if (mx + merlonW > SCENE.GATE_X - SCENE.GATE_WIDTH / 2 - 10 &&
            mx < SCENE.GATE_X + SCENE.GATE_WIDTH / 2 + 10) continue;
        drawSpriteAt(ctx, sprites.castle.merlon, mx, my, 3);
      }
    }

    // Inner wall edge (top) — darker line
    ctx.fillStyle = '#3a3a30';
    ctx.fillRect(0, wallY, gameSize, 4);

    // Torches along the wall
    const torchSprite = sprites.castle.torch[Math.floor(Date.now() / 300) % 2];
    if (torchSprite) {
      const torchPositions = [80, 250, 550, 720];
      for (const tx of torchPositions) {
        drawSpriteAt(ctx, torchSprite, tx - 8, wallY + wallH / 2 - 10, 2.5);
        // Torch glow
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.003 + tx) * 0.05;
        const grd = ctx.createRadialGradient(tx, wallY + wallH / 2, 0, tx, wallY + wallH / 2, 40);
        grd.addColorStop(0, '#ff8800');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(tx - 40, wallY - 10, 80, wallH + 20);
        ctx.restore();
      }
    }

    // Wall shadow on the ground below
    ctx.save();
    const shadowGrd = ctx.createLinearGradient(0, SCENE.WALL_BOTTOM, 0, SCENE.WALL_BOTTOM + 50);
    shadowGrd.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    shadowGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrd;
    ctx.fillRect(0, SCENE.WALL_BOTTOM, gameSize, 50);
    ctx.restore();
  }

  _drawGate(ctx, sprites) {
    const gx = SCENE.GATE_X;
    const gw = SCENE.GATE_WIDTH;
    const gy = SCENE.GATE_Y;
    const gh = SCENE.GATE_HEIGHT;

    // Gate archway (stone frame)
    ctx.fillStyle = '#4a4a40';
    ctx.fillRect(gx - gw / 2 - 8, gy, 8, gh);   // left pillar
    ctx.fillRect(gx + gw / 2, gy, 8, gh);         // right pillar

    // Gate floor (inside the passage)
    ctx.fillStyle = '#2a2820';
    ctx.fillRect(gx - gw / 2, gy, gw, gh);

    // Portcullis — iron bars
    ctx.strokeStyle = '#808078';
    ctx.lineWidth = 3;
    // Vertical bars
    for (let x = gx - gw / 2 + 10; x < gx + gw / 2; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 2);
      ctx.lineTo(x, gy + gh - 2);
      ctx.stroke();
    }
    // Horizontal bars
    for (let y = gy + 12; y < gy + gh; y += 16) {
      ctx.beginPath();
      ctx.moveTo(gx - gw / 2 + 4, y);
      ctx.lineTo(gx + gw / 2 - 4, y);
      ctx.stroke();
    }

    // Portcullis spikes at bottom
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

  _drawEffect(ctx, effect) {
    ctx.save();
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;

    if (effect.type === DefenseItem.OIL && !effect.ignited) {
      // Oil puddle — top-down circle
      ctx.globalAlpha = 0.5 * pulse;
      ctx.fillStyle = '#1a3a5a';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      // Sheen highlight
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(effect.x - 8, effect.y - 5, effect.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === DefenseItem.FIRE || effect.ignited) {
      // Fire — flickering circle
      const flicker = Math.random() * 0.3;
      ctx.globalAlpha = (0.6 + flicker) * pulse;
      ctx.fillStyle = effect.ignited ? '#ff4400' : '#e67e22';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow
      ctx.globalAlpha = 0.5 + flicker;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Sparks (small dots)
      ctx.fillStyle = '#ff6600';
      for (let i = 0; i < 3; i++) {
        const angle = Date.now() * 0.01 + i * 2.1;
        const r = effect.radius * (0.5 + Math.random() * 0.4);
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
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

    // Shadow on ground grows as item falls
    ctx.globalAlpha = 0.4 * t;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(fi.x, fi.targetY, 10 * t + 4, 0, Math.PI * 2);
    ctx.fill();

    // The item itself (grows slightly as it falls toward viewer)
    ctx.globalAlpha = 1;
    const scale = 2 + t * 1.5;
    if (sprite) {
      drawSpriteAt(ctx, sprite, fi.x - sprite.width * scale / 2, fi.y - sprite.height * scale / 2, scale);
    }

    ctx.restore();
  }

  _drawAttacker(ctx, atk, sprites) {
    if (!atk.alive) return;
    ctx.save();

    const bob = Math.sin(atk.phase) * 2;
    const bangOffset = atk.isBanging ? -4 : 0; // lurch toward gate when banging

    // Zombie body — top-down view (circle with details)
    const x = atk.x + bob;
    const y = atk.y + bangOffset;
    const size = atk.type === 'brute' ? 14 : 10;

    // Shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, size + 2, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body (green, darker for brute)
    const bodyColor = atk.type === 'brute' ? '#2E7D32' : '#3a7a2a';
    const headColor = atk.type === 'brute' ? '#388E3C' : '#5cb54c';

    // Body oval (seen from above — "head" faces the gate/up)
    ctx.fillStyle = '#1a1a1a'; // outline
    ctx.beginPath();
    ctx.ellipse(x, y, size + 1, size * 0.75 + 1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (smaller circle at the top/gate-facing end)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.5 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (two dots)
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

    // Arms (stubby lines reaching toward gate when banging)
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

    // Engineer hard hat
    if (atk.type === 'engineer') {
      ctx.fillStyle = '#d4c832';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.45, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Oil slow effect — blue tint
    if (atk.slowFactor < 1) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.ellipse(x, y, size + 2, size * 0.75 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ========== Utility ==========

  isHoldComplete() {
    return this.holdTimer >= this.holdDuration;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
