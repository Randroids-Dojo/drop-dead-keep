import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, DEFAULT_AMMO, AMMO_TYPES, WAVES } from '../constants.js';
import { Renderer } from '../renderer.js';
import { Catapult } from '../entities/catapult.js';
import { Projectile } from '../entities/projectile.js';
import { Bridge } from '../entities/bridge.js';
import { Zombie } from '../entities/zombie.js';
import { circleRectCollision, circleCollision, distance } from '../physics.js';
import { playLaunch, playImpact, playBridgeBreak } from '../audio.js';

// ── Level layout ────────────────────────────────────────
// Waypoints define the winding path up the hill.
// bridgeIndex marks which waypoints cross a bridge.
const WAYPOINTS = [
    { x: 480, y: 600 },    // spawn
    { x: 780, y: 560 },
    { x: 800, y: 530, bridgeIndex: 0 },  // bridge 1
    { x: 820, y: 500 },
    { x: 520, y: 460 },
    { x: 200, y: 430 },
    { x: 180, y: 400, bridgeIndex: 1 },  // bridge 2
    { x: 160, y: 370 },
    { x: 460, y: 340 },
    { x: 700, y: 300 },
    { x: 720, y: 270, bridgeIndex: 2 },  // bridge 3
    { x: 740, y: 240 },
    { x: 480, y: 200 },
    { x: 300, y: 160 },
    { x: 480, y: 100 },    // castle gate
];

const BRIDGE_DEFS = [
    { x: 760, y: 525, w: 80, h: 10 },
    { x: 140, y: 395, w: 80, h: 10 },
    { x: 680, y: 265, w: 80, h: 10 },
];

export class SlingshotScene {
    constructor(ctx, input, gameState) {
        this.ctx = ctx;
        this.input = input;
        this.gameState = gameState;
        this.time = 0;

        this.catapult = new Catapult(480, 85);
        this.projectiles = [];
        this.bridges = BRIDGE_DEFS.map(b => new Bridge(b.x, b.y, b.w, b.h));
        this.zombies = [];
        this.particles = [];

        this.selectedAmmo = 'boulder';
        this.ammo = { ...DEFAULT_AMMO };
        this.wave = 0;
        this.waveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.score = 0;
        this.waveComplete = false;
        this.waveCompleteTimer = 0;

        this._startWave(0);
    }

    _startWave(index) {
        if (index >= WAVES.length) return;
        this.wave = index;
        this.waveActive = true;
        this.waveComplete = false;

        // Build ammo from multiplier
        const mult = WAVES[index].ammoMultiplier;
        this.ammo = {};
        for (const [key, val] of Object.entries(DEFAULT_AMMO)) {
            this.ammo[key] = Math.round(val * mult);
        }

        // Reset bridges
        this.bridges = BRIDGE_DEFS.map(b => new Bridge(b.x, b.y, b.w, b.h));

        // Build spawn queue
        this.spawnQueue = [];
        for (const entry of WAVES[index].enemies) {
            for (let i = 0; i < entry.count; i++) {
                this.spawnQueue.push(entry.type);
            }
        }
        // Shuffle spawn queue
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }

        this.spawnTimer = 0;
        this.zombies = [];
        this.projectiles = [];
    }

    update(dt) {
        this.time += dt;

        // ── Spawn zombies ───────────────────────────────
        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                const type = this.spawnQueue.shift();
                this.zombies.push(new Zombie(type, WAYPOINTS));
                this.spawnTimer = 1.2 + Math.random() * 0.8;
            }
        }

        // ── Input: aiming & firing ──────────────────────
        if (this.input.justPressed && this.catapult.isNear(this.input.x, this.input.y)) {
            this.catapult.aiming = true;
        }

        if (this.catapult.aiming && this.input.justReleased) {
            const drag = this.input.getDragVector();
            if (Math.abs(drag.dx) + Math.abs(drag.dy) > 10) {
                const { vx, vy } = this.catapult.computeLaunch(drag.dx, drag.dy);
                if (this.ammo[this.selectedAmmo] > 0) {
                    this.projectiles.push(new Projectile(this.catapult.x, this.catapult.y - 16, vx, vy, this.selectedAmmo));
                    this.ammo[this.selectedAmmo]--;
                    playLaunch();
                }
            }
            this.catapult.aiming = false;
        }

        // ── Ammo selection click ────────────────────────
        if (this.input.justPressed && !this.catapult.aiming) {
            this._checkAmmoClick(this.input.x, this.input.y);
        }

        // ── Update projectiles ──────────────────────────
        for (const proj of this.projectiles) {
            proj.update(dt);

            // Check bridge collisions
            for (const bridge of this.bridges) {
                if (bridge.state === 'destroyed') continue;
                if (circleRectCollision(proj.x, proj.y, proj.radius, bridge.x, bridge.y, bridge.width, bridge.height)) {
                    bridge.takeDamage(proj.config.damage);
                    proj.alive = false;
                    playImpact();
                    this._spawnParticles(proj.x, proj.y, COLORS.bridgeWood, 8);
                    if (bridge.state === 'destroyed') {
                        playBridgeBreak();
                        this._spawnParticles(bridge.x + bridge.width / 2, bridge.y, COLORS.dust, 15);
                    }
                }
            }

            // Check zombie collisions
            for (const zombie of this.zombies) {
                if (!zombie.alive || zombie.falling) continue;
                if (circleCollision(proj.x, proj.y, proj.radius, zombie.x, zombie.y - 10, zombie.radius)) {
                    zombie.takeDamage(proj.config.damage);
                    proj.alive = false;
                    playImpact();
                    if (!zombie.alive) {
                        this.score += 10;
                        this._spawnParticles(zombie.x, zombie.y, zombie.config.color, 6);
                    }

                    // Area effects
                    if (proj.config.areaRadius) {
                        for (const z2 of this.zombies) {
                            if (z2 === zombie || !z2.alive) continue;
                            if (distance(proj.x, proj.y, z2.x, z2.y) < proj.config.areaRadius) {
                                if (proj.type === 'iceBomb') {
                                    z2.freeze(proj.config.freezeDuration);
                                } else {
                                    z2.takeDamage(proj.config.damage * 0.5);
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Update zombies ──────────────────────────────
        for (const zombie of this.zombies) {
            zombie.update(dt, this.bridges);
            if (zombie.falling && !zombie.alive) {
                this.score += 15; // bonus for bridge kill
            }
        }

        // ── Clean up dead entities ──────────────────────
        this.projectiles = this.projectiles.filter(p => p.alive);
        this.zombies = this.zombies.filter(z => z.alive || z.reachedEnd);

        // ── Update particles ────────────────────────────
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // ── Wave completion ─────────────────────────────
        if (this.waveActive && this.spawnQueue.length === 0 && this.zombies.length === 0) {
            this.waveActive = false;
            this.waveComplete = true;
            this.waveCompleteTimer = 3;
        }

        if (this.waveComplete) {
            this.waveCompleteTimer -= dt;
            if (this.waveCompleteTimer <= 0) {
                this._startWave(this.wave + 1);
            }
        }

        // Gate defense trigger (zombies that reached the end)
        const arrivals = this.zombies.filter(z => z.reachedEnd);
        if (arrivals.length > 0) {
            // Could trigger gate defense scene here
            this.zombies = this.zombies.filter(z => !z.reachedEnd);
        }

        this.input.endFrame();
    }

    _checkAmmoClick(x, y) {
        const types = Object.keys(AMMO_TYPES);
        const startX = 60;
        const btnSize = 44;
        const gap = 8;
        const btnY = CANVAS_HEIGHT - 55;

        for (let i = 0; i < types.length; i++) {
            const bx = startX + i * (btnSize + gap);
            if (x >= bx && x <= bx + btnSize && y >= btnY && y <= btnY + btnSize) {
                this.selectedAmmo = types[i];
                break;
            }
        }
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 1) * 120,
                color,
                life: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 3,
            });
        }
    }

    render() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;

        // ── Sky ─────────────────────────────────────────
        Renderer.drawSky(ctx, W, H);
        Renderer.drawStars(ctx, W, H, this.time);
        Renderer.drawMoon(ctx, 140, 120, 30);

        // ── Hillside terrain ────────────────────────────
        this._drawTerrain(ctx);

        // ── Castle wall at top ──────────────────────────
        this._drawCastle(ctx);

        // ── Bridges ─────────────────────────────────────
        for (const bridge of this.bridges) {
            bridge.render(ctx);
        }

        // ── Path visualization ──────────────────────────
        ctx.strokeStyle = 'rgba(100,80,60,0.3)';
        ctx.lineWidth = 16;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
        for (let i = 1; i < WAYPOINTS.length; i++) {
            ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
        }
        ctx.stroke();

        // ── Zombies ─────────────────────────────────────
        for (const zombie of this.zombies) {
            zombie.render(ctx);
        }

        // ── Projectiles ─────────────────────────────────
        for (const proj of this.projectiles) {
            proj.render(ctx);
        }

        // ── Catapult ────────────────────────────────────
        this.catapult.render(ctx, this.input);

        // ── Particles ───────────────────────────────────
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // ── HUD: Ammo bar ───────────────────────────────
        this._drawAmmoBar(ctx);

        // ── HUD: Score & wave ───────────────────────────
        Renderer.drawText(ctx, `WAVE ${this.wave + 1}`, W - 20, 55, {
            font: 'bold 16px monospace', fill: COLORS.uiAccent, align: 'right',
        });
        Renderer.drawText(ctx, `SCORE: ${this.score}`, W - 20, 75, {
            font: '14px monospace', fill: '#fff', align: 'right',
        });

        // ── HUD: Instructions ───────────────────────────
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, H - 22, W, 22);
        Renderer.drawText(ctx, 'DRAG FROM CATAPULT TO AIM : RELEASE TO FIRE', W / 2, H - 6, {
            font: '11px monospace', fill: COLORS.uiAccent, align: 'center', baseline: 'bottom',
        });

        // ── Wave complete banner ────────────────────────
        if (this.waveComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, H / 2 - 30, W, 60);
            Renderer.drawText(ctx, `WAVE ${this.wave + 1} COMPLETE!`, W / 2, H / 2, {
                font: 'bold 24px monospace', fill: COLORS.uiAccent, align: 'center', baseline: 'middle',
            });
        }
    }

    _drawTerrain(ctx) {
        // Brown hillside with cliff ledges
        const grad = ctx.createLinearGradient(0, 150, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#3a2a1a');
        grad.addColorStop(1, '#5c4033');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        ctx.lineTo(0, 350);
        ctx.quadraticCurveTo(100, 300, 200, 380);
        ctx.lineTo(300, 380);
        ctx.quadraticCurveTo(400, 420, 500, 440);
        ctx.lineTo(600, 440);
        ctx.quadraticCurveTo(700, 400, 800, 480);
        ctx.lineTo(CANVAS_WIDTH, 480);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Grass tufts
        ctx.fillStyle = COLORS.grass;
        const grassPositions = [
            [50, 348], [150, 370], [350, 378], [550, 438], [750, 475], [850, 478],
            [250, 300], [450, 340], [650, 360],
        ];
        for (const [gx, gy] of grassPositions) {
            ctx.beginPath();
            ctx.moveTo(gx - 4, gy);
            ctx.lineTo(gx, gy - 8);
            ctx.lineTo(gx + 4, gy);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(gx + 2, gy);
            ctx.lineTo(gx + 7, gy - 6);
            ctx.lineTo(gx + 10, gy);
            ctx.fill();
        }
    }

    _drawCastle(ctx) {
        const wallY = 60;
        const wallH = 30;

        // Wall
        ctx.fillStyle = COLORS.wallLight;
        ctx.fillRect(350, wallY, 260, wallH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(350, wallY, 260, wallH);

        // Battlements
        ctx.fillStyle = COLORS.wallDark;
        const merlonW = 18;
        const merlonH = 12;
        const gap = 8;
        for (let x = 350; x < 610; x += merlonW + gap) {
            ctx.fillRect(x, wallY - merlonH, merlonW, merlonH);
            ctx.strokeRect(x, wallY - merlonH, merlonW, merlonH);
        }

        // Torches
        this._drawTorch(ctx, 370, wallY - 5);
        this._drawTorch(ctx, 590, wallY - 5);
    }

    _drawTorch(ctx, x, y) {
        // Stick
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x - 2, y, 4, 15);

        // Flame (flickering)
        const flicker = Math.sin(this.time * 8 + x) * 2;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x, y - 3 + flicker, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.ellipse(x, y - 2 + flicker, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawAmmoBar(ctx) {
        const types = Object.keys(AMMO_TYPES);
        const startX = 60;
        const btnSize = 44;
        const gap = 8;
        const btnY = CANVAS_HEIGHT - 55;

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const bx = startX + i * (btnSize + gap);
            const selected = type === this.selectedAmmo;
            const count = this.ammo[type] || 0;

            // Button background
            ctx.fillStyle = selected ? 'rgba(255,140,0,0.3)' : 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, btnY, btnSize, btnSize);
            ctx.strokeStyle = selected ? COLORS.uiAccent : COLORS.uiBorder;
            ctx.lineWidth = selected ? 2 : 1;
            ctx.strokeRect(bx, btnY, btnSize, btnSize);

            // Ammo circle
            ctx.fillStyle = AMMO_TYPES[type].color;
            ctx.beginPath();
            ctx.arc(bx + btnSize / 2, btnY + btnSize / 2 - 4, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Count
            Renderer.drawText(ctx, `${count}`, bx + btnSize / 2, btnY + btnSize - 4, {
                font: '10px monospace', fill: '#fff', align: 'center', baseline: 'bottom',
            });
        }
    }
}
