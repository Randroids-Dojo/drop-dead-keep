// Drop Dead Keep — In-Game HUD Overlay (Pixel Art)

import { drawPixelText, measurePixelText, pixelTextHeight, drawPixelBox, drawPixelBar } from '../sprites/pixel-font.js';

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
