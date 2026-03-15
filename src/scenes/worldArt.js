import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, AMMO_TYPES } from '../constants.js';
import { Renderer } from '../renderer.js';
import { Bridge } from '../entities/bridge.js';

export class WorldArtScene {
    constructor(ctx, input, gameState) {
        this.ctx = ctx;
        this.input = input;
        this.gameState = gameState;
        this.scrollY = 0;
        this.time = 0;
    }

    update(dt) {
        this.time += dt;
        this.input.endFrame();
    }

    render() {
        const ctx = this.ctx;
        const W = CANVAS_WIDTH;
        const H = CANVAS_HEIGHT;

        // Background
        ctx.fillStyle = COLORS.uiBg;
        ctx.fillRect(0, 44, W, H - 44);

        const sectionX = 40;
        let y = 70;

        // ── Section: Destructible Bridge ────────────────
        this._sectionHeader(ctx, 'DESTRUCTIBLE BRIDGE', sectionX, y);
        y += 30;

        // Draw 3 bridge states
        const bridgeLabels = ['INTACT', 'DAMAGED', 'DESTROYED'];
        const bridgeStates = [3, 1, 0]; // hp values

        for (let i = 0; i < 3; i++) {
            const bx = sectionX + 20 + i * 280;
            Renderer.drawText(ctx, bridgeLabels[i], bx + 50, y, {
                font: '10px monospace', fill: COLORS.uiTextDim, align: 'center',
            });

            const bridge = new Bridge(bx, y + 18, 100, 12);
            bridge.hp = bridgeStates[i];
            bridge._updateState();
            bridge.render(ctx);
        }
        y += 70;

        // ── Section: Ammunition ─────────────────────────
        this._sectionHeader(ctx, 'AMMUNITION', sectionX, y);
        y += 30;

        const ammoKeys = Object.keys(AMMO_TYPES);
        for (let i = 0; i < ammoKeys.length; i++) {
            const ammo = AMMO_TYPES[ammoKeys[i]];
            const ax = sectionX + 30 + i * 210;

            // Circle
            ctx.fillStyle = ammo.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ax, y + 20, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.arc(ax - 6, y + 14, 7, 0, Math.PI * 2);
            ctx.fill();

            // Name
            Renderer.drawText(ctx, ammo.name.toUpperCase(), ax, y + 50, {
                font: 'bold 11px monospace', fill: '#fff', align: 'center',
            });

            // Description (wrapped)
            const words = ammo.description.split(' ');
            let line = '';
            let ly = y + 65;
            ctx.font = '10px monospace';
            ctx.fillStyle = COLORS.uiTextDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            for (const word of words) {
                const test = line + word + ' ';
                if (ctx.measureText(test).width > 160) {
                    ctx.fillText(line.trim(), ax, ly);
                    line = word + ' ';
                    ly += 13;
                } else {
                    line = test;
                }
            }
            ctx.fillText(line.trim(), ax, ly);
        }
        y += 120;

        // ── Section: Terrain Elements ───────────────────
        this._sectionHeader(ctx, 'TERRAIN ELEMENTS', sectionX, y);
        y += 30;

        const terrainItems = [
            { name: 'CLIFF PATH', draw: (cx, cy) => this._drawCliffPath(ctx, cx, cy) },
            { name: 'DEAD TREE', draw: (cx, cy) => this._drawDeadTree(ctx, cx, cy) },
            { name: 'WALL TORCH', draw: (cx, cy) => this._drawWallTorch(ctx, cx, cy) },
            { name: 'BATTLEMENT', draw: (cx, cy) => this._drawBattlement(ctx, cx, cy) },
        ];

        for (let i = 0; i < terrainItems.length; i++) {
            const tx = sectionX + 30 + i * 210;
            terrainItems[i].draw(tx, y + 30);
            Renderer.drawText(ctx, terrainItems[i].name, tx, y + 70, {
                font: '10px monospace', fill: COLORS.uiTextDim, align: 'center',
            });
        }
        y += 100;

        // ── Section: Engineer Rebuild Sequence ──────────
        this._sectionHeader(ctx, 'ENGINEER REBUILD SEQUENCE', sectionX, y);
        y += 30;

        const steps = ['ARRIVES', 'PLACES PLANK', 'HAMMERS', 'COMPLETE'];
        const progress = [0, 0.25, 0.6, 1.0];

        for (let i = 0; i < 4; i++) {
            const sx = sectionX + 30 + i * 210;

            Renderer.drawText(ctx, steps[i], sx, y, {
                font: '10px monospace', fill: COLORS.uiTextDim, align: 'center',
            });

            // Mini bridge with rebuild progress
            const barW = 80;
            const barH = 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(sx - barW / 2, y + 50, barW, barH);
            ctx.fillStyle = COLORS.uiAccent;
            ctx.fillRect(sx - barW / 2, y + 50, barW * progress[i], barH);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx - barW / 2, y + 50, barW, barH);

            // Mini engineer
            this._drawMiniEngineer(ctx, sx, y + 30, progress[i]);

            // Step number
            Renderer.drawText(ctx, `${i + 1}`, sx, y + 65, {
                font: 'bold 14px monospace', fill: COLORS.uiTextDim, align: 'center',
            });
        }
    }

    _sectionHeader(ctx, text, x, y) {
        Renderer.drawText(ctx, text, x, y, {
            font: 'bold 14px monospace', fill: COLORS.uiAccent,
        });
        // Underline
        ctx.strokeStyle = COLORS.uiAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x + ctx.measureText(text).width + 20, y + 16);
        ctx.stroke();
    }

    _drawCliffPath(ctx, x, y) {
        ctx.fillStyle = COLORS.ground;
        ctx.beginPath();
        ctx.moveTo(x - 50, y + 15);
        ctx.quadraticCurveTo(x - 30, y - 5, x, y);
        ctx.quadraticCurveTo(x + 30, y + 5, x + 50, y + 10);
        ctx.lineTo(x + 50, y + 25);
        ctx.lineTo(x - 50, y + 25);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Grass
        ctx.fillStyle = COLORS.grass;
        for (let gx = x - 40; gx < x + 40; gx += 15) {
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + 3, y - 6);
            ctx.lineTo(gx + 6, y);
            ctx.fill();
        }
    }

    _drawDeadTree(ctx, x, y) {
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Trunk
        ctx.beginPath();
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x, y - 10);
        ctx.stroke();

        // Branches
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x - 15, y - 20);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 18, y - 15);
        ctx.moveTo(x - 15, y - 20);
        ctx.lineTo(x - 20, y - 28);
        ctx.moveTo(x + 18, y - 15);
        ctx.lineTo(x + 22, y - 25);
        ctx.stroke();

        ctx.lineCap = 'butt';
    }

    _drawWallTorch(ctx, x, y) {
        // Mount
        ctx.fillStyle = '#666';
        ctx.fillRect(x - 3, y, 6, 20);

        // Stick
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x - 2, y - 5, 4, 15);

        // Flame
        const flicker = Math.sin(this.time * 6) * 2;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x, y - 8 + flicker, 6, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.ellipse(x, y - 7 + flicker, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBattlement(ctx, x, y) {
        ctx.fillStyle = COLORS.wallDark;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        // Main block
        ctx.fillRect(x - 20, y, 40, 30);
        ctx.strokeRect(x - 20, y, 40, 30);

        // Merlon on top
        ctx.fillRect(x - 22, y - 12, 16, 12);
        ctx.strokeRect(x - 22, y - 12, 16, 12);
        ctx.fillRect(x + 6, y - 12, 16, 12);
        ctx.strokeRect(x + 6, y - 12, 16, 12);
    }

    _drawMiniEngineer(ctx, x, y, progress) {
        ctx.save();
        ctx.translate(x, y);

        // Body
        ctx.fillStyle = COLORS.zombieGreen;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hat
        ctx.fillStyle = COLORS.engineerHat;
        ctx.fillRect(-4, -14, 8, 3);
        ctx.fillRect(-6, -11.5, 12, 2);

        // Arm with hammer (if actively hammering)
        if (progress > 0.25) {
            const hammerAngle = Math.sin(this.time * 8) * 0.5;
            ctx.save();
            ctx.translate(5, -2);
            ctx.rotate(hammerAngle);
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, -8);
            ctx.stroke();
            ctx.fillStyle = '#666';
            ctx.fillRect(8, -12, 6, 4);
            ctx.restore();
        }

        ctx.restore();
    }
}
