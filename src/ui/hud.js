// Drop Dead Keep — In-Game HUD Overlay

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
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${scoringSystem.score}`, 20, 30);

    // Wave counter (top-center)
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#bdc3c7';
    const waveText = `WAVE ${waveSystem.getCurrentWaveNumber()} / ${waveSystem.getTotalWaves()}`;
    ctx.fillText(waveText, canvasWidth / 2, 25);

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

    // Instruction text at very bottom
    if (!waveSystem.waveActive && !waveSystem.allWavesComplete && !waveSystem.inIntermission) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG FROM CATAPULT TO AIM : RELEASE TO FIRE', canvasWidth / 2, canvasHeight - 8);
    }

    // Intermission countdown
    if (waveSystem.inIntermission) {
      ctx.fillStyle = '#e67e22';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`NEXT WAVE IN ${Math.ceil(waveSystem.intermissionTimer)}...`, canvasWidth / 2, canvasHeight / 2 - 50);
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
    ctx.fillStyle = '#bdc3c7';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('GATE', barX - 5, barY + 11);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // Health bar
    const hpColor = pct > 0.6 ? '#2ecc71' : pct > 0.3 ? '#f1c40f' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Percentage text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(pct * 100)}%`, barX + barW / 2, barY + 11);

    // Flash red on low health
    if (pct <= 0.3 && pct > 0) {
      const flash = Math.sin(Date.now() * 0.01) * 0.3;
      ctx.fillStyle = `rgba(231, 76, 60, ${flash})`;
      ctx.fillRect(barX, barY, barW, barH);
    }
  }

  drawTutorialMessage(ctx, canvasWidth, canvasHeight) {
    const alpha = Math.min(1, this.tutorialFade);
    const pulse = this.tutorialPulse ? 0.8 + Math.sin(Date.now() * 0.005) * 0.2 : 1;

    ctx.save();
    ctx.globalAlpha = alpha * pulse;

    // Background
    const text = this.tutorialMessage;
    ctx.font = 'bold 16px monospace';
    const textWidth = ctx.measureText(text).width;
    const padding = 20;
    const boxW = textWidth + padding * 2;
    const boxH = 36;
    const boxX = canvasWidth / 2 - boxW / 2;
    const boxY = canvasHeight - 100;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvasWidth / 2, boxY + 23);

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

    // Banner background
    const bannerH = 60;
    const bannerY = canvasHeight / 2 - bannerH / 2 - 40;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(xOffset, bannerY, canvasWidth, bannerH);

    // Red accent lines
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(xOffset, bannerY, canvasWidth, 3);
    ctx.fillRect(xOffset, bannerY + bannerH - 3, canvasWidth, 3);

    // Text
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.banner, canvasWidth / 2 + xOffset, bannerY + 38);

    ctx.restore();
  }

  drawFailureHint(ctx, canvasWidth, canvasHeight) {
    const alpha = Math.min(1, this.failureTimer);
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const y = canvasHeight - 140;
    ctx.font = '13px monospace';
    const textW = ctx.measureText(this.failureHint).width;
    ctx.fillRect(canvasWidth / 2 - textW / 2 - 12, y - 12, textW + 24, 28);

    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.fillText(this.failureHint, canvasWidth / 2, y + 5);

    ctx.restore();
  }
}
