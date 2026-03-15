// Drop Dead Keep — Title, Pause, Game-Over, Level-Select, Level-Complete Screens

import { getSprites } from '../sprites/pixel-data.js';
import { drawSpriteAt, setupPixelCanvas } from '../sprites/sprite-renderer.js';
import { drawPixelText, measurePixelText, drawPixelBox, drawPixelButton } from '../sprites/pixel-font.js';

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
    const sprites = getSprites();
    setupPixelCanvas(ctx);

    // Background — solid color bands for sky
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, w, Math.round(h * 0.3));
    ctx.fillStyle = '#12122a';
    ctx.fillRect(0, Math.round(h * 0.3), w, Math.round(h * 0.3));
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, Math.round(h * 0.6), w, h - Math.round(h * 0.6));

    // Stars — 2x2 pixel dots with twinkling alpha
    for (let i = 0; i < 80; i++) {
      const sx = Math.round((Math.sin(i * 127.1) * 0.5 + 0.5) * w);
      const sy = Math.round((Math.cos(i * 311.7) * 0.5 + 0.5) * h * 0.6);
      const twinkle = Math.sin(Date.now() * 0.002 + i * 3) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = 0.2 + twinkle * 0.6;
      ctx.fillStyle = '#ffffdc';
      ctx.fillRect(sx, sy, 2, 2);
      ctx.restore();
    }

    // Moon — sprite at scale 3
    if (sprites.env.moon) {
      drawSpriteAt(ctx, sprites.env.moon, Math.round(w - 130), 40, 3);
    }

    // Castle silhouette — pixel-perfect rectangles
    const castleY = Math.round(h - 120);
    ctx.fillStyle = '#111122';
    // Wall
    ctx.fillRect(Math.round(w / 2 - 150), castleY, 300, 120);
    // Towers
    ctx.fillRect(Math.round(w / 2 - 170), Math.round(castleY - 40), 50, 160);
    ctx.fillRect(Math.round(w / 2 + 120), Math.round(castleY - 40), 50, 160);
    // Crenellations
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(Math.round(w / 2 - 150 + i * 40), Math.round(castleY - 15), 20, 15);
    }
    // Tower crenellations
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(Math.round(w / 2 - 170 + i * 25), Math.round(castleY - 55), 15, 15);
      ctx.fillRect(Math.round(w / 2 + 120 + i * 25), Math.round(castleY - 55), 15, 15);
    }

    // Torches on towers — sprite-based
    if (sprites.castle.torch) {
      const torchFrame = Math.floor(Date.now() / 300) % sprites.castle.torch.length;
      const torchSprite = sprites.castle.torch[torchFrame];
      drawSpriteAt(ctx, torchSprite, Math.round(w / 2 - 155), Math.round(castleY - 35), 2);
      drawSpriteAt(ctx, torchSprite, Math.round(w / 2 + 135), Math.round(castleY - 35), 2);
    }

    // Title
    const titleY = Math.round(h * 0.3);
    drawPixelText(ctx, 'DROP DEAD KEEP', w / 2, titleY, {
      color: '#e67e22',
      size: 6,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // Tagline
    drawPixelText(ctx, 'FLING BOULDERS. SHATTER BRIDGES. SEND THE UNDEAD TUMBLING.', w / 2, titleY + 50, {
      color: '#bdc3c7',
      size: 1,
      align: 'center',
    });

    // Play button
    this.clearButtons();
    const btnW = 200;
    const btnH = 50;
    const btnX = Math.round(w / 2 - btnW / 2);
    const btnY = Math.round(h * 0.55);
    this.addButton('play', 'PLAY', btnX, btnY, btnW, btnH);
    drawPixelButton(ctx, btnX, btnY, btnW, btnH, 'PLAY', {
      bg: '#e67e22',
      hoverBg: '#d35400',
      hover: this.hoveredButton === 'play',
      textSize: 3,
    });

    // Version
    drawPixelText(ctx, 'V1.0 MVP', w / 2, h - 15, {
      color: '#444444',
      size: 1,
      align: 'center',
    });
  }

  drawLevelSelect(ctx, w, h, progress) {
    const sprites = getSprites();
    setupPixelCanvas(ctx);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Title
    drawPixelText(ctx, 'THE FOOTHILLS', w / 2, 30, {
      color: '#e67e22',
      size: 4,
      align: 'center',
    });

    // Subtitle
    drawPixelText(ctx, 'WORLD 1', w / 2, 68, {
      color: '#666666',
      size: 1,
      align: 'center',
    });

    this.clearButtons();

    // Level buttons
    const levels = 5;
    const btnSize = 80;
    const spacing = 20;
    const totalW = levels * btnSize + (levels - 1) * spacing;
    const startX = Math.round(w / 2 - totalW / 2);
    const btnY = Math.round(h * 0.35);

    for (let i = 0; i < levels; i++) {
      const levelId = `1-${i + 1}`;
      const lx = Math.round(startX + i * (btnSize + spacing));
      const completed = progress.levelsCompleted[levelId];
      const stars = progress.stars[levelId] || 0;
      const unlocked = i === 0 || progress.levelsCompleted[`1-${i}`];

      // Button box
      const boxBg = unlocked ? (completed ? '#2d3a2e' : '#2d2d3a') : '#1a1a1a';
      const boxBorder = unlocked ? '#e67e22' : '#333333';
      drawPixelBox(ctx, lx, btnY, btnSize, btnSize, {
        bg: boxBg,
        border: boxBorder,
        borderWidth: 2,
      });

      // Level number
      drawPixelText(ctx, levelId, lx + btnSize / 2, btnY + 20, {
        color: unlocked ? '#ffffff' : '#444444',
        size: 2,
        align: 'center',
      });

      // Stars (using sprites)
      if (completed && sprites.ui.starFilled && sprites.ui.starEmpty) {
        for (let s = 0; s < 3; s++) {
          const starSprite = s < stars ? sprites.ui.starFilled : sprites.ui.starEmpty;
          const starX = Math.round(lx + btnSize / 2 - 24 + s * 16);
          const starY = Math.round(btnY + 50);
          drawSpriteAt(ctx, starSprite, starX, starY, 2);
        }
      }

      // Lock icon (using sprite)
      if (!unlocked && sprites.ui.lock) {
        const lockX = Math.round(lx + btnSize / 2 - sprites.ui.lock.width);
        const lockY = Math.round(btnY + 48);
        drawSpriteAt(ctx, sprites.ui.lock, lockX, lockY, 2);
      }

      if (unlocked) {
        this.addButton(`level_${levelId}`, levelId, lx, btnY, btnSize, btnSize);
      }
    }

    // Back button
    const backW = 100;
    const backH = 36;
    const backX = 20;
    const backY = Math.round(h - 60);
    this.addButton('back', 'BACK', backX, backY, backW, backH, 'secondary');
    drawPixelButton(ctx, backX, backY, backW, backH, 'BACK', {
      bg: '#333333',
      hoverBg: '#444444',
      hover: this.hoveredButton === 'back',
      textSize: 2,
    });
  }

  drawGameOver(ctx, w, h, waveSystem, scoringSystem) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Solid dark red overlay (replaces gradient)
    ctx.fillStyle = 'rgba(120, 30, 20, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Title
    drawPixelText(ctx, 'THE GATE HAS FALLEN', w / 2, Math.round(h * 0.3), {
      color: '#e74c3c',
      size: 4,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // Stats
    const waveInfo = `WAVE ${waveSystem.getCurrentWaveNumber()} OF ${waveSystem.getTotalWaves()}`;
    drawPixelText(ctx, waveInfo, w / 2, Math.round(h * 0.4), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });
    drawPixelText(ctx, `${waveSystem.zombiesKilled} ZOMBIES STOPPED`, w / 2, Math.round(h * 0.44), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });
    drawPixelText(ctx, `SCORE: ${scoringSystem.score}`, w / 2, Math.round(h * 0.48), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });

    // Buttons
    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    const retryX = Math.round(w / 2 - btnW / 2);
    const retryY = Math.round(h * 0.58);
    this.addButton('retry', 'RETRY', retryX, retryY, btnW, btnH);
    drawPixelButton(ctx, retryX, retryY, btnW, btnH, 'RETRY', {
      bg: '#e67e22',
      hoverBg: '#d35400',
      hover: this.hoveredButton === 'retry',
      textSize: 2,
    });

    const levelsX = Math.round(w / 2 - btnW / 2);
    const levelsY = Math.round(h * 0.66);
    this.addButton('levels', 'LEVEL SELECT', levelsX, levelsY, btnW, btnH, 'secondary');
    drawPixelButton(ctx, levelsX, levelsY, btnW, btnH, 'LEVEL SELECT', {
      bg: '#333333',
      hoverBg: '#444444',
      hover: this.hoveredButton === 'levels',
      textSize: 2,
    });
  }

  drawLevelComplete(ctx, w, h, data) {
    const sprites = getSprites();
    setupPixelCanvas(ctx);

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Solid dark green overlay
    ctx.fillStyle = 'rgba(20, 80, 40, 0.2)';
    ctx.fillRect(0, 0, w, h);

    // Title
    drawPixelText(ctx, 'LEVEL COMPLETE!', w / 2, Math.round(h * 0.22), {
      color: '#2ecc71',
      size: 4,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // Stars (using sprites at scale 3)
    const starY = Math.round(h * 0.32);
    if (sprites.ui.starFilled && sprites.ui.starEmpty) {
      for (let i = 0; i < 3; i++) {
        const filled = i < data.stars;
        const starSprite = filled ? sprites.ui.starFilled : sprites.ui.starEmpty;
        const starX = Math.round(w / 2 - 50 + i * 50 - starSprite.width * 1.5);
        drawSpriteAt(ctx, starSprite, starX, starY, 3);
      }
    }

    // Stats
    drawPixelText(ctx, `SCORE: ${data.score}`, w / 2, Math.round(h * 0.42), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });
    drawPixelText(ctx, `ZOMBIES KILLED: ${data.kills}`, w / 2, Math.round(h * 0.46), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });
    drawPixelText(ctx, `GATE BREACHES: ${data.breaches}`, w / 2, Math.round(h * 0.50), {
      color: '#bdc3c7',
      size: 2,
      align: 'center',
    });

    // Buttons
    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    const nextX = Math.round(w / 2 - btnW / 2);
    const nextY = Math.round(h * 0.60);
    this.addButton('next_level', 'NEXT LEVEL', nextX, nextY, btnW, btnH);
    drawPixelButton(ctx, nextX, nextY, btnW, btnH, 'NEXT LEVEL', {
      bg: '#2ecc71',
      hoverBg: '#27ae60',
      hover: this.hoveredButton === 'next_level',
      textSize: 2,
    });

    const levelsX = Math.round(w / 2 - btnW / 2);
    const levelsY = Math.round(h * 0.68);
    this.addButton('levels', 'LEVEL SELECT', levelsX, levelsY, btnW, btnH, 'secondary');
    drawPixelButton(ctx, levelsX, levelsY, btnW, btnH, 'LEVEL SELECT', {
      bg: '#333333',
      hoverBg: '#444444',
      hover: this.hoveredButton === 'levels',
      textSize: 2,
    });
  }

  drawPauseOverlay(ctx, w, h) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    // "PAUSED" text
    drawPixelText(ctx, 'PAUSED', w / 2, Math.round(h * 0.35), {
      color: '#ffffff',
      size: 5,
      align: 'center',
      shadow: '#1a1a1a',
      shadowOffset: 1,
    });

    // Buttons
    this.clearButtons();
    const btnW = 160;
    const btnH = 44;
    const resumeX = Math.round(w / 2 - btnW / 2);
    const resumeY = Math.round(h * 0.45);
    this.addButton('resume', 'RESUME', resumeX, resumeY, btnW, btnH);
    drawPixelButton(ctx, resumeX, resumeY, btnW, btnH, 'RESUME', {
      bg: '#e67e22',
      hoverBg: '#d35400',
      hover: this.hoveredButton === 'resume',
      textSize: 2,
    });

    const levelsX = Math.round(w / 2 - btnW / 2);
    const levelsY = Math.round(h * 0.53);
    this.addButton('levels', 'LEVEL SELECT', levelsX, levelsY, btnW, btnH, 'secondary');
    drawPixelButton(ctx, levelsX, levelsY, btnW, btnH, 'LEVEL SELECT', {
      bg: '#333333',
      hoverBg: '#444444',
      hover: this.hoveredButton === 'levels',
      textSize: 2,
    });
  }
}
