// Drop Dead Keep — In-Game HUD Overlay (Pixel Art)

import { drawPixelText, measurePixelText, pixelTextHeight, drawPixelBox, drawPixelBar, drawPixelButton } from '../sprites/pixel-font.js';
import { getSprites } from '../sprites/pixel-data.js';
import { drawSpriteAt } from '../sprites/sprite-renderer.js';
import { DefenseItem } from '../systems/gate-defense.js';

export class HUD {
  constructor() {
    this.tutorialMessage = null;
    this.tutorialTimer = 0;
    this.tutorialFade = 0;
    this.tutorialPulse = false;

    this.banner = null;
    this.bannerTimer = 0;
    this.bannerDuration = 2;

    this.failureHint = null;
    this.failureTimer = 0;
  }

  showTutorial(message, duration, pulse) {
    this.tutorialMessage = message;
    this.tutorialTimer = duration || 5;
    this.tutorialFade = 1;
    this.tutorialPulse = pulse || false;
  }

  hideTutorial() {
    this.tutorialMessage = null;
  }

  showBanner(text, duration) {
    this.banner = text;
    this.bannerTimer = 0;
    this.bannerDuration = duration || 2;
  }

  showFailureHint(message) {
    this.failureHint = message;
    this.failureTimer = 3;
  }

  update(dt) {
    if (this.tutorialMessage) {
      this.tutorialTimer -= dt;
      if (this.tutorialTimer <= 0) {
        this.tutorialFade -= dt * 2;
        if (this.tutorialFade <= 0) {
          this.tutorialMessage = null;
        }
      }
    }

    if (this.banner) {
      this.bannerTimer += dt;
      if (this.bannerTimer > this.bannerDuration) {
        this.banner = null;
      }
    }

    if (this.failureHint) {
      this.failureTimer -= dt;
      if (this.failureTimer <= 0) {
        this.failureHint = null;
      }
    }
  }

  draw(ctx, canvasWidth, canvasHeight, gameState) {
    const { waveSystem, scoringSystem } = gameState;

    // Score display (top-left)
    drawPixelText(ctx, `SCORE: ${scoringSystem.score}`, 20, 14, {
      color: '#ffffff',
      size: 3,
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // Wave counter (top-center)
    const waveText = `WAVE ${waveSystem.getCurrentWaveNumber()} / ${waveSystem.getTotalWaves()}`;
    drawPixelText(ctx, waveText, canvasWidth / 2, 12, {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });

    // Gate health (top-right)
    this.drawGateHealth(ctx, canvasWidth, waveSystem);

    // Tutorial message
    if (this.tutorialMessage) {
      this.drawTutorialMessage(ctx, canvasWidth, canvasHeight);
    }

    // Banner
    if (this.banner) {
      this.drawBanner(ctx, canvasWidth, canvasHeight);
    }

    // Failure hint
    if (this.failureHint) {
      this.drawFailureHint(ctx, canvasWidth, canvasHeight);
    }

    // Instruction text at very bottom (only during active gameplay)
    if (waveSystem.waveActive) {
      drawPixelText(ctx, 'DRAG FROM CATAPULT TO AIM : RELEASE TO FIRE', canvasWidth / 2, canvasHeight - 14, {
        color: 'rgba(255, 255, 255, 0.4)',
        size: 1,
        align: 'center',
      });
    }

    // Score popups
    scoringSystem.draw(ctx);
  }

  drawGateHealth(ctx, canvasWidth, waveSystem) {
    const barW = 120;
    const barH = 14;
    const barX = canvasWidth - barW - 20;
    const barY = 16;
    const pct = waveSystem.getGateHpPercent();

    // Label
    drawPixelText(ctx, 'GATE', barX - 8, barY + 1, {
      color: '#bdc3c7',
      size: 1,
      align: 'right',
    });

    // Health bar
    const hpColor = pct > 0.6 ? '#2ecc71' : pct > 0.3 ? '#f1c40f' : '#e74c3c';
    drawPixelBar(ctx, barX, barY, barW, barH, pct * 100, 100, {
      bg: '#333333',
      border: '#555555',
      fillColor: hpColor,
    });

    // Percentage text centered on bar
    drawPixelText(ctx, `${Math.ceil(pct * 100)}%`, barX + barW / 2, barY + 3, {
      color: '#ffffff',
      size: 1,
      align: 'center',
    });

    // Flash red on low health
    if (pct <= 0.3 && pct > 0) {
      const flash = Math.sin(Date.now() * 0.01) * 0.3;
      if (flash > 0) {
        ctx.save();
        ctx.globalAlpha = flash;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.restore();
      }
    }
  }

  drawTutorialMessage(ctx, canvasWidth, canvasHeight) {
    const alpha = Math.min(1, this.tutorialFade);
    const pulse = this.tutorialPulse ? 0.8 + Math.sin(Date.now() * 0.005) * 0.2 : 1;

    ctx.save();
    ctx.globalAlpha = alpha * pulse;

    const text = this.tutorialMessage;
    const textSize = 2;
    const textW = measurePixelText(text, textSize);
    const textH = pixelTextHeight(textSize);
    const padding = 16;
    const boxW = textW + padding * 2;
    const boxH = textH + padding * 2;
    const boxX = canvasWidth / 2 - boxW / 2;
    const boxY = canvasHeight - 100;

    drawPixelBox(ctx, boxX, boxY, boxW, boxH, {
      bg: 'rgba(0, 0, 0, 0.7)',
      border: '#e67e22',
      borderWidth: 2,
    });

    drawPixelText(ctx, text, canvasWidth / 2, boxY + padding, {
      color: '#ffffff',
      size: textSize,
      align: 'center',
    });

    ctx.restore();
  }

  drawBanner(ctx, canvasWidth, canvasHeight) {
    const t = this.bannerTimer / this.bannerDuration;

    // Slide in from left, hold, slide out right
    let xOffset = 0;
    let alpha = 1;
    if (t < 0.2) {
      xOffset = (1 - t / 0.2) * -canvasWidth;
    } else if (t > 0.8) {
      xOffset = ((t - 0.8) / 0.2) * canvasWidth;
      alpha = 1 - (t - 0.8) / 0.2;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const textSize = 4;
    const textH = pixelTextHeight(textSize);
    const bannerPadding = 16;
    const bannerH = textH + bannerPadding * 2 + 6; // 6 for accent lines
    const bannerY = canvasHeight / 2 - bannerH / 2 - 40;

    // Banner background
    drawPixelBox(ctx, xOffset, bannerY, canvasWidth, bannerH, {
      bg: 'rgba(0, 0, 0, 0.8)',
      border: '#c0392b',
      borderWidth: 3,
    });

    // Text
    drawPixelText(ctx, this.banner, canvasWidth / 2 + xOffset, bannerY + bannerPadding + 3, {
      color: '#e74c3c',
      size: textSize,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    ctx.restore();
  }

  drawGateDefense(ctx, canvasWidth, canvasHeight, gameState) {
    const { waveSystem, scoringSystem, gateDefense } = gameState;

    // Score display (top-left)
    drawPixelText(ctx, `SCORE: ${scoringSystem.score}`, 20, 14, {
      color: '#ffffff',
      size: 3,
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // "DEFEND THE GATE" header (top-center)
    const pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
    ctx.save();
    ctx.globalAlpha = pulse;
    drawPixelText(ctx, 'DEFEND THE GATE!', canvasWidth / 2, 12, {
      color: '#e74c3c',
      size: 2,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });
    ctx.restore();

    // Gate health (top-right)
    this.drawGateHealth(ctx, canvasWidth, waveSystem);

    // Hold timer (below gate health)
    const remaining = gateDefense.getHoldTimeRemaining();
    const secs = Math.ceil(remaining);
    const holdPct = gateDefense.getHoldProgress();
    const holdBarW = 120;
    const holdBarH = 14;
    const holdBarX = canvasWidth - holdBarW - 20;
    const holdBarY = 40;

    drawPixelText(ctx, 'HOLD', holdBarX - 8, holdBarY + 1, {
      color: '#bdc3c7',
      size: 1,
      align: 'right',
    });

    drawPixelBar(ctx, holdBarX, holdBarY, holdBarW, holdBarH, holdPct * 100, 100, {
      bg: '#333333',
      border: '#555555',
      fillColor: '#e67e22',
    });

    drawPixelText(ctx, `0:${secs.toString().padStart(2, '0')}`, holdBarX + holdBarW / 2, holdBarY + 3, {
      color: '#ffffff',
      size: 1,
      align: 'center',
    });

    // Defense item bar (bottom of screen)
    this.drawDefenseItemBar(ctx, canvasWidth, canvasHeight, gateDefense);

    // Instruction text
    drawPixelText(ctx, 'CLICK TO DROP ITEMS ON ENEMIES', canvasWidth / 2, canvasHeight - 14, {
      color: 'rgba(255, 255, 255, 0.4)',
      size: 1,
      align: 'center',
    });

    // Banner
    if (this.banner) {
      this.drawBanner(ctx, canvasWidth, canvasHeight);
    }

    // Score popups
    scoringSystem.draw(ctx);
  }

  drawDefenseItemBar(ctx, canvasWidth, canvasHeight, gateDefense) {
    const sprites = getSprites();
    const items = [
      { type: DefenseItem.OIL, sprite: sprites.defense.oil, key: 'oil', label: 'OIL', keyNum: '1' },
      { type: DefenseItem.ROCKS, sprite: sprites.defense.rocks, key: 'rocks', label: 'ROCKS', keyNum: '2' },
      { type: DefenseItem.FIRE, sprite: sprites.defense.fire, key: 'fire', label: 'FIRE', keyNum: '3' },
    ];

    const spacing = 70;
    const barY = canvasHeight - 50;
    const startX = canvasWidth / 2 - (items.length * spacing) / 2 + spacing / 2;

    // Background bar
    const bgW = items.length * spacing + 20;
    drawPixelBox(ctx, canvasWidth / 2 - bgW / 2, barY - 22, bgW, 44, {
      bg: 'rgba(0, 0, 0, 0.6)',
      border: '#555555',
      borderWidth: 2,
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ix = startX + i * spacing;
      const count = gateDefense.inventory[item.key];
      const isSelected = gateDefense.selectedItem === item.type;
      const isEmpty = count <= 0;

      // Selection highlight
      if (isSelected && !isEmpty) {
        ctx.save();
        ctx.fillStyle = '#e67e22';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.fillRect(ix - 24, barY - 20, 48, 40);
        ctx.restore();

        // Border
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.strokeRect(ix - 24, barY - 20, 48, 40);
      }

      // Sprite icon
      ctx.save();
      if (isEmpty) ctx.globalAlpha = 0.3;
      drawSpriteAt(ctx, item.sprite, ix - 12, barY - 14, 3);
      ctx.restore();

      // Count text
      drawPixelText(ctx, `x${count}`, ix + 14, barY + 6, {
        color: isEmpty ? '#666666' : '#ffffff',
        size: 1,
        align: 'center',
      });

      // Key hint
      drawPixelText(ctx, item.keyNum, ix - 18, barY - 18, {
        color: '#888888',
        size: 1,
      });
    }
  }

  drawFailureHint(ctx, canvasWidth, canvasHeight) {
    const alpha = Math.min(1, this.failureTimer);
    ctx.save();
    ctx.globalAlpha = alpha;

    const text = this.failureHint;
    const textSize = 2;
    const textW = measurePixelText(text, textSize);
    const textH = pixelTextHeight(textSize);
    const padding = 12;
    const boxW = textW + padding * 2;
    const boxH = textH + padding * 2;
    const boxX = canvasWidth / 2 - boxW / 2;
    const boxY = canvasHeight - 148;

    drawPixelBox(ctx, boxX, boxY, boxW, boxH, {
      bg: 'rgba(0, 0, 0, 0.6)',
      border: '#f1c40f',
      borderWidth: 2,
    });

    drawPixelText(ctx, text, canvasWidth / 2, boxY + padding, {
      color: '#f1c40f',
      size: textSize,
      align: 'center',
    });

    ctx.restore();
  }
}
