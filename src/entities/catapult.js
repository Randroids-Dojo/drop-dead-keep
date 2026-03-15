// Drop Dead Keep — Catapult (Player Weapon) with Slingshot Aiming

import { Projectile, AmmoType, getAmmoStats } from '../physics/projectile.js';

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

    // Catapult base (stone platform)
    ctx.fillStyle = '#555';
    ctx.fillRect(x - 24, y + 8, 48, 12);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 24, y + 8, 48, 12);

    // Catapult frame (A-frame)
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 8);
    ctx.lineTo(x, y - 16);
    ctx.lineTo(x + 16, y + 8);
    ctx.stroke();

    // Catapult arm
    const armLen = 30;
    const armAngle = this.fireAnimation > 0
      ? -Math.PI / 2 + (1 - this.fireAnimation / 0.3) * 0.5
      : this.aiming
        ? Math.PI / 2 + this.armAngle * 0.3
        : -Math.PI / 4;

    ctx.save();
    ctx.translate(x, y - 10);
    ctx.rotate(armAngle);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -armLen);
    ctx.stroke();

    // Sling cup at end of arm
    if (!this.fireAnimation || this.fireAnimation <= 0) {
      ctx.fillStyle = '#6B4226';
      ctx.beginPath();
      ctx.arc(0, -armLen, 6, 0, Math.PI * 2);
      ctx.fill();

      // Show loaded ammo
      if (!this.reloading && this.ammoInventory[this.selectedAmmo] > 0) {
        const stats = getAmmoStats(this.selectedAmmo);
        ctx.beginPath();
        ctx.arc(0, -armLen, 5, 0, Math.PI * 2);
        ctx.fillStyle = stats.color;
        ctx.fill();
      }
    }
    ctx.restore();

    // Highlight pulse (for tutorial)
    if (this.highlight) {
      const pulse = Math.sin(this.pulseTimer * 4) * 0.3 + 0.3;
      ctx.strokeStyle = `rgba(230, 126, 34, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 30, y - 24, 60, 48);
    }

    // Reload bar
    if (this.reloading) {
      const barW = 40;
      const barH = 4;
      const barY = y + 24;
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barW / 2, barY, barW, barH);
      const pct = this.reloadTimer / this.reloadDuration;
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x - barW / 2, barY, barW * pct, barH);
    }
  }

  drawAimingUI(ctx, canvasWidth, canvasHeight) {
    if (!this.aiming) return;

    // Targeting line (dotted)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Landing reticle — size grows with distance
    const dist = Math.sqrt(
      (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2
    );
    const maxDist = 600;
    const spreadNorm = Math.min(dist / maxDist, 1);
    const reticleRadius = 15 + spreadNorm * 35;

    // Reticle color: green (close) -> yellow (mid) -> red (far)
    let reticleColor;
    if (spreadNorm < 0.33) {
      reticleColor = `rgba(100, 220, 100, 0.6)`;
    } else if (spreadNorm < 0.66) {
      reticleColor = `rgba(220, 220, 100, 0.6)`;
    } else {
      reticleColor = `rgba(220, 100, 100, ${0.5 + Math.sin(this.pulseTimer * 6) * 0.15})`;
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(this.targetX, this.targetY, reticleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair
    const ch = 6;
    ctx.beginPath();
    ctx.moveTo(this.targetX - ch, this.targetY);
    ctx.lineTo(this.targetX + ch, this.targetY);
    ctx.moveTo(this.targetX, this.targetY - ch);
    ctx.lineTo(this.targetX, this.targetY + ch);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Power indicator near catapult
    const pw = 6;
    const ph = 30;
    const px = this.x + 35;
    const py = this.y - ph / 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(px, py, pw, ph);
    const fillH = ph * this.aimPower;
    ctx.fillStyle = this.aimPower > 0.8 ? '#e74c3c' : this.aimPower > 0.5 ? '#f1c40f' : '#2ecc71';
    ctx.fillRect(px, py + ph - fillH, pw, fillH);
  }

  drawAmmoBar(ctx, canvasWidth, canvasHeight, unlockedAmmo) {
    const barY = canvasHeight - 50;
    const ammoTypes = [AmmoType.BOULDER, AmmoType.FIREBALL, AmmoType.ICE_BOMB, AmmoType.MEGA_BOMB];
    const iconSize = 32;
    const spacing = 60;
    const startX = canvasWidth / 2 - (ammoTypes.length * spacing) / 2 + spacing / 2;

    for (let i = 0; i < ammoTypes.length; i++) {
      const type = ammoTypes[i];
      if (!unlockedAmmo.includes(type)) continue;

      const ix = startX + i * spacing;
      const iy = barY;
      const stats = getAmmoStats(type);
      const count = this.ammoInventory[type];
      const selected = type === this.selectedAmmo;

      // Background
      ctx.fillStyle = selected ? 'rgba(230, 126, 34, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(ix - iconSize / 2, iy - iconSize / 2, iconSize, iconSize);

      if (selected) {
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.strokeRect(ix - iconSize / 2, iy - iconSize / 2, iconSize, iconSize);
      }

      // Ammo icon
      ctx.beginPath();
      ctx.arc(ix, iy, 10, 0, Math.PI * 2);
      ctx.fillStyle = count > 0 ? stats.color : '#444';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Count
      ctx.fillStyle = count > 0 ? '#fff' : '#666';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${count}`, ix, iy + iconSize / 2 + 12);

      // Key hint
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.fillText(`${i + 1}`, ix, iy - iconSize / 2 - 4);
    }
  }
}
