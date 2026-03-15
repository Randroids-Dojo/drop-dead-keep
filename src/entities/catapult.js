// Drop Dead Keep — Catapult (Player Weapon) with Slingshot Aiming

import { Projectile, AmmoType, getAmmoStats } from '../physics/projectile.js';
import { getSprites } from '../sprites/pixel-data.js';
import { drawSprite, drawSpriteAt, setupPixelCanvas } from '../sprites/sprite-renderer.js';
import { drawPixelText, drawPixelBar, drawPixelBox } from '../sprites/pixel-font.js';

// Map ammo type keys to projectile sprite keys
const AMMO_SPRITE_KEY = {
  boulder: 'boulder',
  fireball: 'fireball',
  ice_bomb: 'icebomb',
  mega_bomb: 'megabomb',
};

export class Catapult {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 32;

    // Aiming state
    this.aiming = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragX = 0;
    this.dragY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.aimPower = 0;
    this.maxDragDist = 150;

    // Ammo
    this.selectedAmmo = AmmoType.BOULDER;
    this.ammoInventory = {
      boulder: 15,
      fireball: 0,
      ice_bomb: 0,
      mega_bomb: 0,
    };

    // Reload
    this.reloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 1.5;

    // Animation
    this.armAngle = 0;
    this.fireAnimation = 0;
    this.highlight = false;
    this.pulseTimer = 0;
  }

  setAmmoForLevel(ammo) {
    this.ammoInventory = { ...ammo };
  }

  selectAmmo(type) {
    if (this.ammoInventory[type] > 0 || type === AmmoType.BOULDER) {
      this.selectedAmmo = type;
    }
  }

  startAim(mouseX, mouseY) {
    if (this.reloading) return false;
    if (this.ammoInventory[this.selectedAmmo] <= 0) return false;

    // Must click near the catapult
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    if (Math.sqrt(dx * dx + dy * dy) > 80) return false;

    this.aiming = true;
    this.dragStartX = mouseX;
    this.dragStartY = mouseY;
    this.dragX = mouseX;
    this.dragY = mouseY;
    return true;
  }

  updateAim(mouseX, mouseY, canvasHeight) {
    if (!this.aiming) return;

    this.dragX = mouseX;
    this.dragY = mouseY;

    // Calculate drag vector (from catapult to mouse)
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.maxDragDist);
    this.aimPower = clampedDist / this.maxDragDist;

    // Target is opposite of drag direction (slingshot mechanic)
    // Drag down = aim up, drag left = aim right
    if (dist > 5) {
      const normX = -dx / dist;
      const normY = -dy / dist;
      const range = clampedDist * 4; // How far the shot travels
      this.targetX = this.x + normX * range;
      this.targetY = this.y + normY * range;

      // Clamp target to screen
      this.targetX = Math.max(20, Math.min(this.targetX, 1200));
      this.targetY = Math.max(20, Math.min(this.targetY, canvasHeight - 20));
    }

    // Arm angle based on drag
    this.armAngle = Math.atan2(dy, dx);
  }

  fire(physics) {
    if (!this.aiming) return null;
    this.aiming = false;

    // Cancel if drag is too short
    const dx = this.dragX - this.x;
    const dy = this.dragY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 15) {
      return null;
    }

    // Consume ammo
    this.ammoInventory[this.selectedAmmo]--;

    // Start reload
    this.reloading = true;
    this.reloadTimer = 0;
    const stats = getAmmoStats(this.selectedAmmo);
    this.reloadDuration = stats.reloadTime;

    // Fire animation
    this.fireAnimation = 0.3;

    // Calculate scale at target position (perspective)
    const yNorm = this.targetY / 800;
    const scale = 0.4 + yNorm * 0.6;

    return new Projectile(
      physics, this.x, this.y,
      this.targetX, this.targetY,
      this.selectedAmmo, scale
    );
  }

  cancelAim() {
    this.aiming = false;
  }

  update(dt) {
    this.pulseTimer += dt;

    if (this.reloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.reloadDuration) {
        this.reloading = false;
      }
    }

    if (this.fireAnimation > 0) {
      this.fireAnimation -= dt;
    }

    if (!this.aiming) {
      this.armAngle *= 0.9; // Return to resting position
    }
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const sprites = getSprites();

    setupPixelCanvas(ctx);

    // 1. Draw catapult base sprite centered at (x, y+8) at scale 2
    const baseSprite = sprites.catapult.base;
    if (baseSprite) {
      const bw = baseSprite.width * 2;
      const bh = baseSprite.height * 2;
      drawSpriteAt(ctx, baseSprite, x - bw / 2, y + 8 - bh / 2, 2);
    }

    // 2. Draw the arm sprite rotated from the hinge point (x, y-10)
    const armLen = 30;
    const armAngle = this.fireAnimation > 0
      ? -Math.PI / 2 + (1 - this.fireAnimation / 0.3) * 0.5
      : this.aiming
        ? Math.PI / 2 + this.armAngle * 0.3
        : -Math.PI / 4;

    const armSprite = sprites.catapult.arm;
    if (armSprite) {
      drawSprite(ctx, armSprite, x, y - 10, 2, { rotation: armAngle });
    }

    // 3. Draw sling at end of arm
    const slingSprite = sprites.catapult.sling;
    if (slingSprite && (!this.fireAnimation || this.fireAnimation <= 0)) {
      const slingX = x + Math.cos(armAngle - Math.PI / 2) * armLen;
      const slingY = (y - 10) + Math.sin(armAngle - Math.PI / 2) * armLen;
      drawSprite(ctx, slingSprite, slingX, slingY, 2);

      // 4. Draw loaded ammo projectile sprite at sling position
      if (!this.reloading && this.ammoInventory[this.selectedAmmo] > 0) {
        const spriteKey = AMMO_SPRITE_KEY[this.selectedAmmo];
        const projSprite = sprites.projectile[spriteKey];
        if (projSprite) {
          drawSprite(ctx, projSprite, slingX, slingY, 2);
        }
      }
    }

    // 5. Highlight pulse (for tutorial) - pulsing pixel rectangle border
    if (this.highlight) {
      const pulse = Math.sin(this.pulseTimer * 4) * 0.3 + 0.3;
      ctx.fillStyle = `rgba(230, 126, 34, ${pulse})`;
      const bx = x - 30;
      const by = y - 24;
      const bw = 60;
      const bh = 48;
      const bdr = 2;
      // Top
      ctx.fillRect(bx, by, bw, bdr);
      // Bottom
      ctx.fillRect(bx, by + bh - bdr, bw, bdr);
      // Left
      ctx.fillRect(bx, by, bdr, bh);
      // Right
      ctx.fillRect(bx + bw - bdr, by, bdr, bh);
    }

    // 6. Reload bar using drawPixelBar
    if (this.reloading) {
      const barW = 40;
      const barH = 6;
      const barY = y + 24;
      const pct = this.reloadTimer / this.reloadDuration;
      drawPixelBar(ctx, x - barW / 2, barY, barW, barH, this.reloadTimer, this.reloadDuration, {
        fillColor: '#e67e22',
      });
    }
  }

  drawAimingUI(ctx, canvasWidth, canvasHeight) {
    if (!this.aiming) return;

    setupPixelCanvas(ctx);

    // 1. Targeting line as a series of small pixel dots (2x2 squares spaced apart)
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const lineDist = Math.sqrt(dx * dx + dy * dy);
    const dotSpacing = 10;
    const dotCount = Math.floor(lineDist / dotSpacing);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < dotCount; i++) {
      const t = i / dotCount;
      const px = Math.round(this.x + dx * t);
      const py = Math.round(this.y + dy * t);
      ctx.fillRect(px, py, 2, 2);
    }

    // 2. Landing reticle — square bracket style (4 corner pieces)
    const dist = Math.sqrt(
      (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2
    );
    const maxDist = 600;
    const spreadNorm = Math.min(dist / maxDist, 1);
    const reticleSize = 15 + spreadNorm * 35;

    // Reticle color: green (close) -> yellow (mid) -> red (far)
    let reticleColor;
    if (spreadNorm < 0.33) {
      reticleColor = `rgba(100, 220, 100, 0.6)`;
    } else if (spreadNorm < 0.66) {
      reticleColor = `rgba(220, 220, 100, 0.6)`;
    } else {
      reticleColor = `rgba(220, 100, 100, ${0.5 + Math.sin(this.pulseTimer * 6) * 0.15})`;
    }

    ctx.fillStyle = reticleColor;
    const tx = Math.round(this.targetX);
    const ty = Math.round(this.targetY);
    const half = Math.round(reticleSize);
    const cornerLen = Math.round(reticleSize * 0.4);
    const thickness = 2;

    // Top-left corner
    ctx.fillRect(tx - half, ty - half, cornerLen, thickness);
    ctx.fillRect(tx - half, ty - half, thickness, cornerLen);

    // Top-right corner
    ctx.fillRect(tx + half - cornerLen, ty - half, cornerLen, thickness);
    ctx.fillRect(tx + half - thickness, ty - half, thickness, cornerLen);

    // Bottom-left corner
    ctx.fillRect(tx - half, ty + half - thickness, cornerLen, thickness);
    ctx.fillRect(tx - half, ty + half - cornerLen, thickness, cornerLen);

    // Bottom-right corner
    ctx.fillRect(tx + half - cornerLen, ty + half - thickness, cornerLen, thickness);
    ctx.fillRect(tx + half - thickness, ty + half - cornerLen, thickness, cornerLen);

    // 3. Crosshair: pixel-perfect lines (2px wide)
    const ch = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    // Horizontal
    ctx.fillRect(tx - ch, ty - 1, ch * 2, 2);
    // Vertical
    ctx.fillRect(tx - 1, ty - ch, 2, ch * 2);

    // 4. Power bar using drawPixelBar
    const pw = 8;
    const ph = 30;
    const px = this.x + 35;
    const py = this.y - ph / 2;
    const powerColor = this.aimPower > 0.8 ? '#e74c3c' : this.aimPower > 0.5 ? '#f1c40f' : '#2ecc71';
    drawPixelBar(ctx, px, py, pw, ph, this.aimPower, 1, {
      fillColor: powerColor,
    });
  }

  drawAmmoBar(ctx, canvasWidth, canvasHeight, unlockedAmmo) {
    const sprites = getSprites();
    const barY = canvasHeight - 50;
    const ammoTypes = [AmmoType.BOULDER, AmmoType.FIREBALL, AmmoType.ICE_BOMB, AmmoType.MEGA_BOMB];
    const iconSize = 32;
    const spacing = 60;
    const startX = canvasWidth / 2 - (ammoTypes.length * spacing) / 2 + spacing / 2;

    setupPixelCanvas(ctx);

    for (let i = 0; i < ammoTypes.length; i++) {
      const type = ammoTypes[i];
      if (!unlockedAmmo.includes(type)) continue;

      const ix = startX + i * spacing;
      const iy = barY;
      const count = this.ammoInventory[type];
      const selected = type === this.selectedAmmo;

      // Background box using drawPixelBox
      const boxX = ix - iconSize / 2;
      const boxY = iy - iconSize / 2;
      drawPixelBox(ctx, boxX, boxY, iconSize, iconSize, {
        bg: selected ? 'rgba(230, 126, 34, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        border: selected ? '#e67e22' : '#333333',
        borderWidth: 2,
      });

      // Draw projectile sprite inside the slot
      const spriteKey = AMMO_SPRITE_KEY[type];
      const projSprite = sprites.projectile[spriteKey];
      if (projSprite) {
        const spriteScale = 2;
        const sw = projSprite.width * spriteScale;
        const sh = projSprite.height * spriteScale;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (count <= 0) ctx.globalAlpha = 0.3;
        ctx.drawImage(projSprite, Math.round(ix - sw / 2), Math.round(iy - sh / 2), sw, sh);
        ctx.restore();
      }

      // Count text using drawPixelText
      drawPixelText(ctx, `${count}`, ix, iy + iconSize / 2 + 2, {
        color: count > 0 ? '#ffffff' : '#666666',
        size: 1,
        align: 'center',
      });

      // Key hint using drawPixelText
      drawPixelText(ctx, `${i + 1}`, ix, iy - iconSize / 2 - 10, {
        color: '#666666',
        size: 1,
        align: 'center',
      });
    }
  }
}
