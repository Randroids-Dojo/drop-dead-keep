import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GATE_MAX_HP, GATE_HOLD_TIME, GATE_DEFENSES } from '../constants.js';
import { Renderer } from '../renderer.js';
import { distance } from '../physics.js';

export class GateDefenseScene {
    constructor(ctx, input, gameState) {
        this.ctx = ctx;
        this.input = input;
        this.gameState = gameState;
        this.time = 0;

        this.gateHp = GATE_MAX_HP;
        this.holdTimer = GATE_HOLD_TIME;
        this.selectedDefense = 'oil';
        this.defenseUses = {};
        for (const [key, val] of Object.entries(GATE_DEFENSES)) {
            this.defenseUses[key] = val.uses;
        }

        this.zombies = this._spawnZombies(20);
        this.effects = [];
        this.active = true;
    }

    _spawnZombies(count) {
        const zombies = [];
        for (let i = 0; i < count; i++) {
            zombies.push({
                x: 150 + Math.random() * (CANVAS_WIDTH - 300),
                y: 250 + Math.random() * 300,
                vx: (Math.random() - 0.5) * 30,
                vy: -15 - Math.random() * 20,
                hp: 2,
                alive: true,
                frozen: false,
                frozenTimer: 0,
                bobTimer: Math.random() * Math.PI * 2,
            });
        }
        return zombies;
    }

    update(dt) {
        this.time += dt;

        if (!this.active) return;

        this.holdTimer -= dt;
        if (this.holdTimer <= 0) {
            this.active = false;
            return;
        }

        // ── Input: deploy defenses ──────────────────────
        if (this.input.justPressed) {
            const x = this.input.x;
            const y = this.input.y;

            // Check defense selector
            this._checkDefenseClick(x, y);

            // Deploy on battlefield (below wall, y > 150)
            if (y > 150 && y < CANVAS_HEIGHT - 80) {
                if (this.defenseUses[this.selectedDefense] > 0) {
                    this.defenseUses[this.selectedDefense]--;
                    this._deployDefense(x, y, this.selectedDefense);
                }
            }
        }

        // ── Update zombies ──────────────────────────────
        for (const z of this.zombies) {
            if (!z.alive) continue;
            z.bobTimer += dt * 4;

            if (z.frozen) {
                z.frozenTimer -= dt;
                if (z.frozenTimer <= 0) z.frozen = false;
                continue;
            }

            // Move toward gate (top of screen)
            z.x += z.vx * dt;
            z.y += z.vy * dt;

            // Bounce off walls
            if (z.x < 100 || z.x > CANVAS_WIDTH - 100) z.vx *= -1;
            if (z.y < 120) {
                // Reached gate — deal damage
                this.gateHp -= 2;
                z.vy = Math.abs(z.vy);
                z.y = 130;
            }
            if (z.y > CANVAS_HEIGHT - 80) z.vy = -Math.abs(z.vy);
        }

        // ── Update effects ──────────────────────────────
        for (const effect of this.effects) {
            effect.timer -= dt;
            // Apply damage over time
            if (effect.type === 'fire') {
                for (const z of this.zombies) {
                    if (!z.alive) continue;
                    if (distance(effect.x, effect.y, z.x, z.y) < effect.radius) {
                        z.hp -= GATE_DEFENSES.fire.damagePerSec * dt;
                        if (z.hp <= 0) z.alive = false;
                    }
                }
            }
            // Oil slow effect
            if (effect.type === 'oil') {
                for (const z of this.zombies) {
                    if (!z.alive) continue;
                    if (distance(effect.x, effect.y, z.x, z.y) < effect.radius) {
                        z.vx *= 0.95;
                        z.vy *= 0.95;
                    }
                }
            }
        }
        this.effects = this.effects.filter(e => e.timer > 0);
        this.zombies = this.zombies.filter(z => z.alive);

        if (this.gateHp <= 0) {
            this.active = false;
        }

        this.input.endFrame();
    }

    _checkDefenseClick(x, y) {
        const types = Object.keys(GATE_DEFENSES);
        const startX = CANVAS_WIDTH / 2 - (types.length * 110) / 2;
        const btnY = CANVAS_HEIGHT - 60;

        for (let i = 0; i < types.length; i++) {
            const bx = startX + i * 110;
            if (x >= bx && x <= bx + 100 && y >= btnY && y <= btnY + 50) {
                this.selectedDefense = types[i];
                break;
            }
        }
    }

    _deployDefense(x, y, type) {
        const config = GATE_DEFENSES[type];
        if (type === 'rocks') {
            // Instant damage in area
            for (const z of this.zombies) {
                if (!z.alive) continue;
                if (distance(x, y, z.x, z.y) < config.radius) {
                    z.hp -= config.damage;
                    if (z.hp <= 0) z.alive = false;
                }
            }
            this.effects.push({ type, x, y, radius: config.radius, timer: 0.5 });
        } else if (type === 'oil') {
            this.effects.push({ type, x, y, radius: config.radius, timer: 6 });
        } else if (type === 'fire') {
            this.effects.push({ type, x, y, radius: config.radius, timer: config.duration });
        }
    }

    render() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;

        // ── Background: top-down stone wall view ────────
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, 50, W, H - 50);

        // Wall at top
        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(0, 50, W, 80);
        // Stone pattern
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            for (let y = 50; y < 130; y += 20) {
                ctx.strokeRect(x + ((y / 20) % 2) * 20, y, 40, 20);
            }
        }

        // Gate in center
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(W / 2 - 50, 70, 100, 60);
        // Gate bars
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        for (let gx = W / 2 - 45; gx < W / 2 + 50; gx += 12) {
            ctx.beginPath();
            ctx.moveTo(gx, 70);
            ctx.lineTo(gx, 130);
            ctx.stroke();
        }
        for (let gy = 75; gy < 130; gy += 15) {
            ctx.beginPath();
            ctx.moveTo(W / 2 - 50, gy);
            ctx.lineTo(W / 2 + 50, gy);
            ctx.stroke();
        }

        // Oil spouts
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(W / 2 - 120, 105, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(W / 2 + 120, 105, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Ground area ─────────────────────────────────
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(80, 130, W - 160, H - 210);

        // ── Effects ─────────────────────────────────────
        for (const effect of this.effects) {
            ctx.globalAlpha = 0.4;
            if (effect.type === 'oil') {
                ctx.fillStyle = COLORS.oil;
            } else if (effect.type === 'fire') {
                ctx.fillStyle = COLORS.fire;
            } else {
                ctx.fillStyle = COLORS.rocks;
            }
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // ── Zombies ─────────────────────────────────────
        for (const z of this.zombies) {
            if (!z.alive) continue;
            ctx.save();
            ctx.translate(z.x, z.y);

            // Simple top-down zombie (green circle with arms)
            ctx.fillStyle = z.frozen ? COLORS.ice : COLORS.zombieGreen;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
            ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
            ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Arms reaching up
            ctx.strokeStyle = COLORS.zombieGreen;
            ctx.lineWidth = 2;
            const bob = Math.sin(z.bobTimer) * 3;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(-14, -6 + bob);
            ctx.moveTo(8, 0);
            ctx.lineTo(14, -6 - bob);
            ctx.stroke();

            ctx.restore();
        }

        // ── HUD: Gate HP bar ────────────────────────────
        const barW = 300;
        const barH = 24;
        const barX = W / 2 - barW / 2 - 60;
        const barY = H - 75;

        ctx.fillStyle = COLORS.gateBarBg;
        ctx.fillRect(barX, barY, barW, barH);
        const hpRatio = Math.max(0, this.gateHp / GATE_MAX_HP);
        ctx.fillStyle = COLORS.gateBar;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        Renderer.drawText(ctx, `GATE ${Math.round(hpRatio * 100)}%`, barX + barW / 2, barY + barH / 2, {
            font: 'bold 13px monospace', fill: '#fff', align: 'center', baseline: 'middle',
        });

        // ── HUD: Hold timer ─────────────────────────────
        const timerX = W / 2 + barW / 2 + 20;
        ctx.fillStyle = COLORS.uiPanel;
        ctx.fillRect(timerX, barY, 100, barH);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(timerX, barY, 100, barH);
        const mins = Math.floor(this.holdTimer / 60);
        const secs = Math.floor(this.holdTimer % 60);
        Renderer.drawText(ctx, `HOLD ${mins}:${secs.toString().padStart(2, '0')}`, timerX + 50, barY + barH / 2, {
            font: 'bold 13px monospace', fill: '#fff', align: 'center', baseline: 'middle',
        });

        // ── HUD: Defense selector ───────────────────────
        const types = Object.keys(GATE_DEFENSES);
        const startX = W / 2 - (types.length * 110) / 2;
        const btnY = H - 45;

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const bx = startX + i * 110;
            const selected = type === this.selectedDefense;

            ctx.fillStyle = selected ? 'rgba(255,140,0,0.3)' : 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, btnY, 100, 35);
            ctx.strokeStyle = selected ? COLORS.uiAccent : COLORS.uiBorder;
            ctx.lineWidth = selected ? 2 : 1;
            ctx.strokeRect(bx, btnY, 100, 35);

            Renderer.drawText(ctx, `${GATE_DEFENSES[type].name.toUpperCase()}`, bx + 50, btnY + 10, {
                font: 'bold 11px monospace', fill: '#fff', align: 'center',
            });
            Renderer.drawText(ctx, `x${this.defenseUses[type]}`, bx + 50, btnY + 23, {
                font: '10px monospace', fill: COLORS.uiTextDim, align: 'center',
            });
        }

        // ── Instructions ────────────────────────────────
        Renderer.drawText(ctx, 'TAP / CLICK BELOW THE WALL TO DEPLOY', W / 2, btnY + 42, {
            font: '10px monospace', fill: COLORS.uiTextDim, align: 'center',
        });
    }
}
