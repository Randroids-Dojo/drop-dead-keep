import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, ENEMY_TYPES } from '../constants.js';
import { Renderer } from '../renderer.js';

const TYPES_LIST = Object.keys(ENEMY_TYPES);

export class BestiaryScene {
    constructor(ctx, input, gameState) {
        this.ctx = ctx;
        this.input = input;
        this.gameState = gameState;
        this.selected = 0;
        this.time = 0;
    }

    update(dt) {
        this.time += dt;

        if (this.input.justPressed) {
            // Check thumbnail clicks
            const thumbX = 40;
            const thumbStartY = 100;
            const thumbH = 80;

            for (let i = 0; i < TYPES_LIST.length; i++) {
                const ty = thumbStartY + i * thumbH;
                if (this.input.x >= thumbX && this.input.x <= thumbX + 140 &&
                    this.input.y >= ty && this.input.y <= ty + thumbH) {
                    this.selected = i;
                    break;
                }
            }
        }

        this.input.endFrame();
    }

    render() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;

        // Background
        ctx.fillStyle = COLORS.uiBg;
        ctx.fillRect(0, 44, W, H - 44);

        const key = TYPES_LIST[this.selected];
        const enemy = ENEMY_TYPES[key];

        // ── Left panel: thumbnails ──────────────────────
        const panelW = 180;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(20, 60, panelW, H - 80);

        Renderer.drawText(ctx, 'ALL TYPES', 30, 70, {
            font: '11px monospace', fill: COLORS.uiTextDim,
        });

        for (let i = 0; i < TYPES_LIST.length; i++) {
            const t = ENEMY_TYPES[TYPES_LIST[i]];
            const ty = 100 + i * 80;
            const isSelected = i === this.selected;

            // Selection highlight
            if (isSelected) {
                ctx.strokeStyle = COLORS.uiAccent;
                ctx.lineWidth = 2;
                ctx.strokeRect(30, ty, panelW - 20, 70);
            }

            // Mini zombie drawing
            this._drawMiniZombie(ctx, 80, ty + 35, t.color, TYPES_LIST[i]);

            // Name
            Renderer.drawText(ctx, t.name.toUpperCase(), 120, ty + 35, {
                font: '11px monospace',
                fill: isSelected ? '#fff' : COLORS.uiTextDim,
                baseline: 'middle',
            });
        }

        // ── Right panel: details ────────────────────────
        const detailX = panelW + 60;

        // Tier
        Renderer.drawText(ctx, enemy.tier.toUpperCase(), detailX + 180, 75, {
            font: '11px monospace', fill: COLORS.uiAccent,
        });

        // Name
        Renderer.drawText(ctx, enemy.name.toUpperCase(), detailX + 180, 100, {
            font: 'bold 28px monospace', fill: '#fff',
        });

        // Description
        this._drawWrappedText(ctx, enemy.description, detailX + 180, 140, 300, 16);

        // Large zombie preview
        this._drawLargeZombie(ctx, detailX + 60, 280, enemy.color, key);

        // ── Stats ───────────────────────────────────────
        const statsX = detailX + 180;
        const statsY = 230;
        Renderer.drawText(ctx, 'STATS', statsX, statsY, {
            font: '12px monospace', fill: COLORS.uiTextDim,
        });

        const stats = [
            { label: 'HP', value: enemy.hp },
            { label: 'SPD', value: enemy.spd },
            { label: 'DMG', value: enemy.dmg },
            { label: 'ARM', value: enemy.arm },
        ];

        for (let i = 0; i < stats.length; i++) {
            const sy = statsY + 25 + i * 28;
            Renderer.drawText(ctx, stats[i].label, statsX, sy, {
                font: '12px monospace', fill: COLORS.uiTextDim,
                baseline: 'middle',
            });

            // Pips (6 total)
            for (let p = 0; p < 6; p++) {
                const px = statsX + 45 + p * 22;
                ctx.fillStyle = p < stats[i].value ? COLORS.zombieGreen : '#333';
                ctx.fillRect(px, sy - 6, 16, 12);
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, sy - 6, 16, 12);
            }
        }
    }

    _drawMiniZombie(ctx, x, y, color, type) {
        ctx.save();
        ctx.translate(x, y);

        // Body
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-2, -11, 2, 0, Math.PI * 2);
        ctx.arc(2, -11, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-1.5, -10.5, 1, 0, Math.PI * 2);
        ctx.arc(2.5, -10.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Type decoration
        if (type === 'engineer') {
            ctx.fillStyle = COLORS.engineerHat;
            ctx.fillRect(-5, -17, 10, 4);
        } else if (type === 'brute') {
            ctx.fillStyle = COLORS.bruteArmor;
            ctx.fillRect(-5, -3, 10, 8);
        }

        ctx.restore();
    }

    _drawLargeZombie(ctx, x, y, color, type) {
        ctx.save();
        ctx.translate(x, y);
        const s = 3.5; // scale

        const bob = Math.sin(this.time * 2) * 3;

        // Body
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, bob, 8 * s, 10 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Belly patch
        ctx.fillStyle = '#b8a878';
        ctx.beginPath();
        ctx.ellipse(0, bob + 5, 5 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, bob - 12 * s, 8 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-3 * s, bob - 13 * s, 3 * s, 0, Math.PI * 2);
        ctx.arc(3 * s, bob - 13 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-2.5 * s, bob - 12.5 * s, 1.5 * s, 0, Math.PI * 2);
        ctx.arc(3.5 * s, bob - 12.5 * s, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7 * s, bob);
        ctx.lineTo(-14 * s, bob - 5 * s);
        ctx.moveTo(7 * s, bob);
        ctx.lineTo(14 * s, bob - 5 * s);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Type decoration
        if (type === 'engineer') {
            ctx.fillStyle = COLORS.engineerHat;
            ctx.fillRect(-6 * s, bob - 20 * s, 12 * s, 4 * s);
            ctx.fillRect(-8 * s, bob - 16.5 * s, 16 * s, 2.5 * s);
        } else if (type === 'brute') {
            ctx.fillStyle = COLORS.bruteArmor;
            ctx.fillRect(-6 * s, bob - 5 * s, 12 * s, 10 * s);
        }

        ctx.restore();
    }

    _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let ly = y;

        ctx.font = '13px monospace';
        ctx.fillStyle = COLORS.uiTextDim;
        ctx.textBaseline = 'top';

        for (const word of words) {
            const test = line + word + ' ';
            const metrics = ctx.measureText(test);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line.trim(), x, ly);
                line = word + ' ';
                ly += lineHeight;
            } else {
                line = test;
            }
        }
        ctx.fillText(line.trim(), x, ly);
    }
}
