// Drop Dead Keep — Title, Pause, Game-Over, Level-Select, Level-Complete Screens

export class MenuSystem {
  constructor() {
    this.buttons = [];
    this.hoveredButton = null;

    // Level complete screen data
    this.levelCompleteData = null;
    this.starAnimIndex = 0;
    this.starAnimTimer = 0;
  }

  clearButtons() {
    this.buttons = [];
    this.hoveredButton = null;
  }

  addButton(id, label, x, y, w, h, style) {
    this.buttons.push({ id, label, x, y, w, h, style: style || 'primary' });
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w &&
          my >= btn.y && my <= btn.y + btn.h) {
        return btn.id;
      }
    }
    return null;
  }

  handleHover(mx, my) {
    this.hoveredButton = null;
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w &&
          my >= btn.y && my <= btn.y + btn.h) {
        this.hoveredButton = btn.id;
        return;
      }
    }
  }

  drawTitleScreen(ctx, w, h) {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 311.7) * 0.5 + 0.5) * h * 0.6;
      const twinkle = Math.sin(Date.now() * 0.002 + i * 3) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 220, ${0.2 + twinkle * 0.6})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Moon
    ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
    ctx.beginPath();
    ctx.arc(w - 100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(w - 88, 73, 27, 0, Math.PI * 2);
    ctx.fill();

    // Castle silhouette at bottom
    ctx.fillStyle = '#111122';
    const castleY = h - 120;
    // Wall
    ctx.fillRect(w / 2 - 150, castleY, 300, 120);
    // Towers
    ctx.fillRect(w / 2 - 170, castleY - 40, 50, 160);
    ctx.fillRect(w / 2 + 120, castleY - 40, 50, 160);
    // Crenellations
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(w / 2 - 150 + i * 40, castleY - 15, 20, 15);
    }
    // Tower crenellations
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(w / 2 - 170 + i * 25, castleY - 55, 15, 15);
      ctx.fillRect(w / 2 + 120 + i * 25, castleY - 55, 15, 15);
    }

    // Torch glow on towers
    for (const tx of [w / 2 - 145, w / 2 + 145]) {
      const glow = ctx.createRadialGradient(tx, castleY - 20, 0, tx, castleY - 20, 40);
      glow.addColorStop(0, 'rgba(230, 126, 34, 0.3)');
      glow.addColorStop(1, 'rgba(230, 126, 34, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(tx - 40, castleY - 60, 80, 80);
      // Flame
      const flicker = Math.sin(Date.now() * 0.01 + tx) * 2;
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(tx, castleY - 25 + flicker, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title
    const titleY = h * 0.3;
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DROP DEAD KEEP', w / 2, titleY);

    // Title shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('DROP DEAD KEEP', w / 2 + 3, titleY + 3);

    // Tagline
    ctx.fillStyle = '#bdc3c7';
    ctx.font = '15px monospace';
    ctx.fillText('Fling boulders. Shatter bridges. Send the undead tumbling.', w / 2, titleY + 40);

    // Play button
    this.clearButtons();
    const btnW = 200;
    const btnH = 50;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.55;
    this.addButton('play', 'PLAY', btnX, btnY, btnW, btnH);
    this.drawButton(ctx, this.buttons[0]);

    // Version
    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.fillText('v1.0 MVP', w / 2, h - 15);
  }

  drawLevelSelect(ctx, w, h, progress) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE FOOTHILLS', w / 2, 50);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('World 1', w / 2, 72);

    this.clearButtons();

    // Level buttons
    const levels = 5;
    const btnSize = 80;
    const spacing = 20;
    const totalW = levels * btnSize + (levels - 1) * spacing;
    const startX = w / 2 - totalW / 2;
    const btnY = h * 0.35;

    for (let i = 0; i < levels; i++) {
      const levelId = `1-${i + 1}`;
      const lx = startX + i * (btnSize + spacing);
      const completed = progress.levelsCompleted[levelId];
      const stars = progress.stars[levelId] || 0;
      const unlocked = i === 0 || progress.levelsCompleted[`1-${i}`];

      // Button background
      ctx.fillStyle = unlocked ? (completed ? '#2d3a2e' : '#2d2d3a') : '#1a1a1a';
      ctx.fillRect(lx, btnY, btnSize, btnSize);

      // Border
      ctx.strokeStyle = unlocked ? '#e67e22' : '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, btnY, btnSize, btnSize);

      // Level number
      ctx.fillStyle = unlocked ? '#fff' : '#444';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(levelId, lx + btnSize / 2, btnY + 35);

      // Stars
      if (completed) {
        ctx.font = '14px monospace';
        let starStr = '';
        for (let s = 0; s < 3; s++) {
          starStr += s < stars ? '\u2605' : '\u2606';
        }
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(starStr, lx + btnSize / 2, btnY + 55);
      }

      // Lock icon
      if (!unlocked) {
        ctx.fillStyle = '#555';
        ctx.font = '24px monospace';
        ctx.fillText('\u{1F512}', lx + btnSize / 2, btnY + 55);
      }

      if (unlocked) {
        this.addButton(`level_${levelId}`, levelId, lx, btnY, btnSize, btnSize);
      }
    }

    // Back button
    const backW = 100;
    const backH = 36;
    this.addButton('back', 'BACK', 20, h - 60, backW, backH, 'secondary');
    this.drawButton(ctx, this.buttons[this.buttons.length - 1]);
  }

  drawGameOver(ctx, w, h, waveSystem, scoringSystem) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Red radial burst
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 300);
    grad.addColorStop(0, 'rgba(192, 57, 43, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE GATE HAS FALLEN', w / 2, h * 0.3);

    // Stats
    ctx.fillStyle = '#bdc3c7';
    ctx.font = '14px monospace';
    const waveInfo = `Wave ${waveSystem.getCurrentWaveNumber()} of ${waveSystem.getTotalWaves()}`;
    ctx.fillText(waveInfo, w / 2, h * 0.4);
    ctx.fillText(`${waveSystem.zombiesKilled} zombies stopped`, w / 2, h * 0.44);
    ctx.fillText(`Score: ${scoringSystem.score}`, w / 2, h * 0.48);

    // Buttons
    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    this.addButton('retry', 'RETRY', w / 2 - btnW / 2, h * 0.58, btnW, btnH);
    this.addButton('levels', 'LEVEL SELECT', w / 2 - btnW / 2, h * 0.66, btnW, btnH, 'secondary');
    for (const btn of this.buttons) this.drawButton(ctx, btn);
  }

  drawLevelComplete(ctx, w, h, data) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', w / 2, h * 0.22);

    // Stars
    ctx.font = '40px monospace';
    const starY = h * 0.32;
    for (let i = 0; i < 3; i++) {
      const filled = i < data.stars;
      ctx.fillStyle = filled ? '#f1c40f' : '#444';
      ctx.fillText(filled ? '\u2605' : '\u2606', w / 2 - 50 + i * 50, starY);
    }

    // Stats
    ctx.fillStyle = '#bdc3c7';
    ctx.font = '14px monospace';
    ctx.fillText(`Score: ${data.score}`, w / 2, h * 0.42);
    ctx.fillText(`Zombies Killed: ${data.kills}`, w / 2, h * 0.46);
    ctx.fillText(`Gate Breaches: ${data.breaches}`, w / 2, h * 0.50);

    // Buttons
    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    this.addButton('next_level', 'NEXT LEVEL', w / 2 - btnW / 2, h * 0.60, btnW, btnH);
    this.addButton('levels', 'LEVEL SELECT', w / 2 - btnW / 2, h * 0.68, btnW, btnH, 'secondary');
    for (const btn of this.buttons) this.drawButton(ctx, btn);
  }

  drawButton(ctx, btn) {
    const hovered = this.hoveredButton === btn.id;
    const isPrimary = btn.style !== 'secondary';

    // Background
    if (isPrimary) {
      ctx.fillStyle = hovered ? '#d35400' : '#e67e22';
    } else {
      ctx.fillStyle = hovered ? '#444' : '#333';
    }
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    // Border
    ctx.strokeStyle = isPrimary ? '#f39c12' : '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
  }

  drawPauseOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2, h * 0.35);

    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    this.addButton('resume', 'RESUME', w / 2 - btnW / 2, h * 0.45, btnW, btnH);
    this.addButton('levels', 'LEVEL SELECT', w / 2 - btnW / 2, h * 0.53, btnW, btnH, 'secondary');
    for (const btn of this.buttons) this.drawButton(ctx, btn);
  }
}
