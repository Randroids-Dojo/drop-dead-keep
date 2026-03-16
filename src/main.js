// Drop Dead Keep — Main Entry Point
// Fling boulders to shatter bridges and send the undead tumbling into the abyss

import { Game, GameState } from './game.js';
import { PhysicsWorld } from './physics/world.js';
import { Catapult } from './entities/catapult.js';
import { AmmoType } from './physics/projectile.js';
import { GameMap } from './world/map.js';
import { Camera } from './world/camera.js';
import { WaveSystem } from './systems/wave.js';
import { ScoringSystem } from './systems/scoring.js';
import { ParticleSystem } from './systems/particles.js';
import { AudioEngine } from './audio/audio.js';
import { HUD } from './ui/hud.js';
import { MenuSystem } from './ui/menus.js';
import { InputHandler } from './ui/controls.js';
import { UpdateBanner } from './ui/update-banner.js';
import { PauseFab } from './ui/pause-fab.js';
import { FeedbackFab } from './ui/feedback-fab.js';
import { LEVELS } from './data/levels.js';
import { setupPixelCanvas } from './sprites/sprite-renderer.js';
import { getSprites } from './sprites/pixel-data.js';

// --- Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Initialize pixel art sprite cache early
getSprites();

// Virtual game resolution — all game logic uses this coordinate space
const GAME_SIZE = 800;
let gameScale = 1;
let gameOffsetX = 0;
let gameOffsetY = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateGameTransform();
}

function updateGameTransform() {
  const sx = canvas.width / GAME_SIZE;
  const sy = canvas.height / GAME_SIZE;
  gameScale = Math.min(sx, sy);
  gameOffsetX = (canvas.width - GAME_SIZE * gameScale) / 2;
  gameOffsetY = (canvas.height - GAME_SIZE * gameScale) / 2;
}

function canvasToGame(cx, cy) {
  return {
    x: (cx - gameOffsetX) / gameScale,
    y: (cy - gameOffsetY) / gameScale,
  };
}

window.addEventListener('resize', resize);
resize();

// --- Systems ---
const game = new Game(canvas, ctx);
const physics = new PhysicsWorld();
const camera = new Camera(GAME_SIZE, GAME_SIZE);
const waveSystem = new WaveSystem();
const scoring = new ScoringSystem();
const particles = new ParticleSystem();
const audio = new AudioEngine();
const hud = new HUD();
const menus = new MenuSystem();
const input = new InputHandler(canvas);
const updateBanner = new UpdateBanner();
const pauseFab = new PauseFab();
const feedbackFab = new FeedbackFab();

// Initialize HTML overlays
updateBanner.init();
feedbackFab.init();
pauseFab.init(() => {
  if (game.state === GameState.PLAYING || game.state === GameState.PRE_LEVEL || game.state === GameState.WAVE_CLEAR) {
    game.setState(GameState.PAUSED);
  }
});

// --- Game Objects ---
let gameMap = null;
let catapult = null;
let projectiles = [];
let currentLevelId = null;
let tutorialStep = 0;
let firstShotFired = false;
let shotsFired = 0;
let preWaveTimer = 0;

// --- Level Loading ---
function loadLevel(levelId) {
  const level = LEVELS[levelId];
  if (!level) return;

  currentLevelId = levelId;
  physics.clear();
  physics.reset();

  gameMap = new GameMap(physics, GAME_SIZE, GAME_SIZE);
  gameMap.loadLevel(level);

  catapult = new Catapult(GAME_SIZE / 2, gameMap.castleY - 30);
  catapult.setAmmoForLevel(level.ammo);

  projectiles = [];
  scoring.reset();
  waveSystem.loadWaves(level.waves, level.gateHp);

  tutorialStep = 0;
  firstShotFired = false;
  shotsFired = 0;
  preWaveTimer = 2;

  game.setState(GameState.PRE_LEVEL);
}

// --- Tutorial System ---
function updateTutorial(dt) {
  const level = LEVELS[currentLevelId];
  if (!level || !level.tutorial) return;

  const steps = level.tutorial.steps;
  if (tutorialStep >= steps.length) return;

  const step = steps[tutorialStep];

  switch (step.trigger) {
    case 'start':
      hud.showTutorial(step.message, step.duration || 10, true);
      if (step.highlight === 'ammo') {
        // Highlight will be handled by drawing
      }
      tutorialStep++;
      break;

    case 'start_delayed':
      // Uses a separate timer to delay showing this message
      if (!step._timer) step._timer = 3;
      step._timer -= dt;
      if (step._timer <= 0) {
        hud.showTutorial(step.message, step.duration || 5);
        tutorialStep++;
      }
      break;

    case 'ammo_selected':
      // Wait until player starts aiming
      if (catapult.aiming) {
        hud.showTutorial(step.message, step.duration || 10, true);
        tutorialStep++;
      }
      break;

    case 'first_fire':
      if (firstShotFired) {
        hud.showTutorial(step.message, step.duration || 2);
        tutorialStep++;
      }
      break;

    case 'first_fire_2':
      // Wait for the "Nicely done!" message to fade before showing this
      if (shotsFired >= 1 && !catapult.aiming && !hud.tutorialMessage) {
        hud.showTutorial(step.message, step.duration || 8, true);
        tutorialStep++;
      }
      break;

    case 'wave_2':
      if (waveSystem.currentWave >= 1 || waveSystem.zombies.length > 0) {
        hud.showTutorial(step.message, step.duration || 5);
        tutorialStep++;
      }
      break;
  }
}

// --- Projectile Impact Handling ---
function handleProjectileImpact(proj) {
  const impact = proj.getImpactPosition();
  const stats = proj.stats;

  // Screen shake (bigger for close hits)
  const yNorm = impact.y / GAME_SIZE;
  camera.shake(3 + yNorm * 5);

  // Play impact sound
  audio.play('impact_wood');

  // Particles
  const scale = 0.4 + yNorm * 0.6;
  particles.emitImpact(impact.x, impact.y, scale);
  particles.emitDust(impact.x, impact.y, scale);

  // Check bridge hits
  for (const bridge of gameMap.bridges) {
    if (bridge.destroyed) continue;
    const dx = impact.x - bridge.x;
    const dy = impact.y - bridge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = stats.splashRadius * scale;

    if (dist < hitRadius + bridge.width / 2) {
      const damage = stats.damage * (1 - dist / (hitRadius + bridge.width / 2));
      bridge.takeDamage(damage);

      if (bridge.destroyed) {
        audio.play('bridge_collapse');
        particles.emitSplinters(bridge.x, bridge.y, bridge.scale);
        scoring.onBridgeDestroyed(bridge.x, bridge.y);
        camera.shake(6);
      }
    }
  }

  // Check zombie hits
  let kills = 0;
  for (const zombie of waveSystem.zombies) {
    if (!zombie.alive || zombie.falling) continue;
    if (zombie.isInRadius(impact.x, impact.y, stats.splashRadius * scale)) {
      const dx = zombie.x - impact.x;
      const dy = zombie.y - impact.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dmgFactor = 1 - dist / (stats.splashRadius * scale);
      const damage = Math.max(1, Math.ceil(stats.damage * dmgFactor));

      const wasBecomingPlank = zombie.becomingPlank;
      zombie.takeDamage(damage);

      if (!zombie.alive) {
        kills++;
        scoring.onZombieKilledByProjectile(zombie.x, zombie.y);
        if (wasBecomingPlank) {
          scoring.onBuilderKilledWhileBuilding(zombie.x, zombie.y);
        }
        audio.play('zombie_splat');
      }
    }
  }

  if (kills >= 3) {
    scoring.onMultiKill(kills, impact.x, impact.y);
    audio.play('multi_kill');
  }
}

// --- Main Update ---
function update(time) {
  const dt = game.dt;
  game.update(time);
  camera.update(dt);
  camera.resize(GAME_SIZE, GAME_SIZE);

  switch (game.state) {
    case GameState.TITLE:
      break;

    case GameState.LEVEL_SELECT:
      break;

    case GameState.PRE_LEVEL:
      preWaveTimer -= dt;
      if (preWaveTimer <= 0) {
        game.setState(GameState.PLAYING);
        startNextWave();
      }
      break;

    case GameState.PLAYING:
      updatePlaying(dt);
      break;

    case GameState.WAVE_CLEAR:
      preWaveTimer -= dt;
      if (preWaveTimer <= 0) {
        if (waveSystem.allWavesComplete) {
          completeLevelScreen();
        } else {
          startNextWave();
          game.setState(GameState.PLAYING);
        }
      }
      break;

    case GameState.LEVEL_COMPLETE:
    case GameState.GAME_OVER:
    case GameState.PAUSED:
      break;
  }

  // Update HTML overlay visibility
  const isActive = game.state === GameState.PLAYING || game.state === GameState.PRE_LEVEL || game.state === GameState.WAVE_CLEAR;
  const isPaused = game.state === GameState.PAUSED;
  pauseFab.setVisible(isActive && !isPaused);
  feedbackFab.setVisible(isPaused);
}

function updatePlaying(dt) {
  // Update catapult
  catapult.update(dt);

  // Convert input to game coordinates
  const gm = canvasToGame(input.mouseX, input.mouseY);

  // Handle aiming
  if (input.mouseJustPressed) {
    if (!catapult.aiming && !catapult.reloading) {
      // Check if clicking on ammo bar first
      const ammoClicked = handleAmmoBarClick(gm.x, gm.y);
      if (!ammoClicked) {
        catapult.startAim(gm.x, gm.y);
      }
    }
  }

  if (input.mouseDown && catapult.aiming) {
    catapult.updateAim(gm.x, gm.y, GAME_SIZE);
  }

  if (input.mouseJustReleased && catapult.aiming) {
    const proj = catapult.fire(physics);
    if (proj) {
      projectiles.push(proj);
      audio.play('fire');
      if (!firstShotFired) firstShotFired = true;
      shotsFired++;
    }
  }

  // Keyboard ammo selection
  if (input.isKeyJustPressed('1')) catapult.selectAmmo(AmmoType.BOULDER);
  if (input.isKeyJustPressed('2')) catapult.selectAmmo(AmmoType.FIREBALL);
  if (input.isKeyJustPressed('3')) catapult.selectAmmo(AmmoType.ICE_BOMB);
  if (input.isKeyJustPressed('4')) catapult.selectAmmo(AmmoType.MEGA_BOMB);

  // Pause
  if (input.isKeyJustPressed('Escape') || input.isKeyJustPressed('p')) {
    game.setState(GameState.PAUSED);
    return;
  }

  // Update projectiles and handle impacts
  for (const proj of projectiles) {
    proj.update(dt);
    if (proj.impacted && !proj._impactHandled) {
      proj._impactHandled = true;
      handleProjectileImpact(proj);
    }
  }

  // Remove dead projectiles
  projectiles = projectiles.filter(p => p.alive);

  // Update wave system
  waveSystem.update(dt, gameMap.bridges);

  // Check for zombie falls (when they hit a destroyed bridge)
  for (const zombie of waveSystem.zombies) {
    if (zombie.falling && !zombie._fallScored) {
      zombie._fallScored = true;
      audio.play('zombie_fall');
      scoring.onZombieKilledByFalling(zombie.x, zombie.y);
    }
  }

  // Physics update (for debris)
  physics.update(dt);

  // Particles
  particles.update(dt);

  // Scoring
  scoring.update(dt);

  // HUD
  hud.update(dt);

  // Tutorial
  updateTutorial(dt);

  // Check game over
  if (waveSystem.isGameOver()) {
    audio.play('gate_alarm');
    game.setState(GameState.GAME_OVER);
    return;
  }

  // Check wave complete
  if (waveSystem.waveComplete && game.state === GameState.PLAYING) {
    waveSystem.waveComplete = false;
    if (waveSystem.allWavesComplete) {
      audio.play('wave_clear');
      completeLevelScreen();
    } else {
      audio.play('wave_clear');
      game.setState(GameState.WAVE_CLEAR);
      preWaveTimer = 4; // intermission
    }
  }
}

function startNextWave() {
  const path = gameMap.getZombiePath();
  const started = waveSystem.startWave(gameMap.spawnPoint, path);

  if (started) {
    if (waveSystem.isFinalWave()) {
      hud.showBanner('FINAL WAVE', 2.5);
    } else if (waveSystem.currentWave > 0) {
      hud.showBanner(`WAVE ${waveSystem.getCurrentWaveNumber()}`, 1.5);
    }
    audio.play('wave_horn');
  }
}

function completeLevelScreen() {
  const breaches = waveSystem.zombiesBreached;
  const stars = scoring.getStarRating(breaches);
  scoring.onLevelCleared(breaches === 0);

  // Save progress
  game.progress.levelsCompleted[currentLevelId] = true;
  const prevStars = game.progress.stars[currentLevelId] || 0;
  game.progress.stars[currentLevelId] = Math.max(prevStars, stars);
  const prevScore = game.progress.highScores[currentLevelId] || 0;
  game.progress.highScores[currentLevelId] = Math.max(prevScore, scoring.score);
  game.saveProgress();

  menus.levelCompleteData = {
    stars,
    score: scoring.score,
    kills: waveSystem.zombiesKilled,
    breaches,
  };

  game.setState(GameState.LEVEL_COMPLETE);
}

function handleAmmoBarClick(mx, my) {
  const barY = GAME_SIZE - 50;
  if (my < barY - 20 || my > barY + 20) return false;

  const ammoTypes = [AmmoType.BOULDER, AmmoType.FIREBALL, AmmoType.ICE_BOMB, AmmoType.MEGA_BOMB];
  const spacing = 60;
  const startX = GAME_SIZE / 2 - (ammoTypes.length * spacing) / 2 + spacing / 2;

  for (let i = 0; i < ammoTypes.length; i++) {
    const type = ammoTypes[i];
    if (!game.progress.unlockedAmmo.includes(type)) continue;
    const ix = startX + i * spacing;
    if (Math.abs(mx - ix) < 20) {
      catapult.selectAmmo(type);
      audio.play('ui_click');
      return true;
    }
  }
  return false;
}

// --- Main Draw ---
function draw() {
  // Disable image smoothing for pixel-perfect rendering
  setupPixelCanvas(ctx);

  // Clear and fill letterbox areas with sky color
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply game coordinate transform (800x800 virtual → viewport)
  ctx.save();
  ctx.translate(gameOffsetX, gameOffsetY);
  ctx.scale(gameScale, gameScale);
  ctx.imageSmoothingEnabled = false;

  switch (game.state) {
    case GameState.TITLE:
      menus.drawTitleScreen(ctx, GAME_SIZE, GAME_SIZE);
      break;

    case GameState.LEVEL_SELECT:
      menus.drawLevelSelect(ctx, GAME_SIZE, GAME_SIZE, game.progress);
      break;

    case GameState.PRE_LEVEL:
    case GameState.PLAYING:
    case GameState.WAVE_CLEAR:
      drawGameplay();
      break;

    case GameState.PAUSED:
      drawGameplay();
      menus.drawPauseOverlay(ctx, GAME_SIZE, GAME_SIZE);
      break;

    case GameState.GAME_OVER:
      drawGameplay();
      menus.drawGameOver(ctx, GAME_SIZE, GAME_SIZE, waveSystem, scoring);
      break;

    case GameState.LEVEL_COMPLETE:
      drawGameplay();
      menus.drawLevelComplete(ctx, GAME_SIZE, GAME_SIZE, menus.levelCompleteData);
      break;
  }

  ctx.restore();
}

function drawGameplay() {
  camera.apply(ctx);

  // Map (sky, terrain, paths, cliffs, bridges, castle)
  gameMap.draw(ctx);

  // Zombies (sorted by Y for depth)
  const allZombies = [...waveSystem.zombies].sort((a, b) => a.y - b.y);
  for (const zombie of allZombies) {
    zombie.draw(ctx);
  }

  // Projectiles
  for (const proj of projectiles) {
    proj.draw(ctx);
  }

  // Particles
  particles.draw(ctx);

  // Catapult
  catapult.draw(ctx);

  camera.restore(ctx);

  // UI (not affected by camera, but still in game coordinates)
  catapult.drawAimingUI(ctx, GAME_SIZE, GAME_SIZE);
  catapult.drawAmmoBar(ctx, GAME_SIZE, GAME_SIZE, game.progress.unlockedAmmo);
  hud.draw(ctx, GAME_SIZE, GAME_SIZE, { waveSystem, scoringSystem: scoring });
}

// --- Input Handling for Menus ---
function handleMenuInput() {
  if (!input.mouseJustPressed) return;

  const gm = canvasToGame(input.mouseX, input.mouseY);
  menus.handleHover(gm.x, gm.y);
  const clicked = menus.handleClick(gm.x, gm.y);
  if (!clicked) return;

  audio.init();
  audio.play('ui_click');

  switch (game.state) {
    case GameState.TITLE:
      if (clicked === 'play') {
        game.setState(GameState.LEVEL_SELECT);
      }
      break;

    case GameState.LEVEL_SELECT:
      if (clicked === 'back') {
        game.setState(GameState.TITLE);
      } else if (clicked.startsWith('level_')) {
        const levelId = clicked.replace('level_', '');
        loadLevel(levelId);
      }
      break;

    case GameState.GAME_OVER:
      if (clicked === 'retry') {
        loadLevel(currentLevelId);
      } else if (clicked === 'levels') {
        game.setState(GameState.LEVEL_SELECT);
      }
      break;

    case GameState.LEVEL_COMPLETE:
      if (clicked === 'next_level') {
        const parts = currentLevelId.split('-');
        const world = parseInt(parts[0]);
        const level = parseInt(parts[1]);
        const nextId = `${world}-${level + 1}`;
        if (LEVELS[nextId]) {
          loadLevel(nextId);
        } else {
          game.setState(GameState.LEVEL_SELECT);
        }
      } else if (clicked === 'levels') {
        game.setState(GameState.LEVEL_SELECT);
      }
      break;

    case GameState.PAUSED:
      if (clicked === 'resume') {
        game.setState(GameState.PLAYING);
      } else if (clicked === 'levels') {
        game.setState(GameState.LEVEL_SELECT);
      }
      break;
  }
}

// --- Hover for Menus ---
function handleMenuHover() {
  if (game.state === GameState.TITLE || game.state === GameState.LEVEL_SELECT ||
      game.state === GameState.GAME_OVER || game.state === GameState.LEVEL_COMPLETE ||
      game.state === GameState.PAUSED) {
    const gm = canvasToGame(input.mouseX, input.mouseY);
    menus.handleHover(gm.x, gm.y);
  }
}

// --- Game Loop ---
function gameLoop(time) {
  update(time);
  handleMenuInput();
  handleMenuHover();
  draw();
  input.endFrame();
  requestAnimationFrame(gameLoop);
}

// Start
game.lastTime = performance.now();
requestAnimationFrame(gameLoop);
