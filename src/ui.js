import { CANVAS_WIDTH, COLORS } from './constants.js';
import { Renderer } from './renderer.js';

const TABS = [
    { id: 'slingshot', label: 'SLINGSHOT', icon: '\u25CE' },
    { id: 'gateDefense', label: 'GATE DEFENSE', icon: '\u26EA' },
    { id: 'bestiary', label: 'BESTIARY', icon: '\u2620' },
    { id: 'worldArt', label: 'WORLD ART', icon: '\u2609' },
];

const TAB_HEIGHT = 44;

export class UI {
    constructor(canvas, ctx, onSwitch) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onSwitch = onSwitch;

        canvas.addEventListener('mousedown', (e) => this._handleClick(e));
        canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this._handleClick(t);
        }, { passive: true });
    }

    _handleClick(e) {
        // We need to convert to logical coords
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const scaleX = this.canvas.width / CANVAS_WIDTH;
        const screenX = (e.clientX - rect.left) * dpr;
        const screenY = (e.clientY - rect.top) * dpr;

        // Check if within tab bar area (in screen space, approximate)
        const tabScreenHeight = TAB_HEIGHT * (this.canvas.width / CANVAS_WIDTH);
        if (screenY > tabScreenHeight) return;

        const tabWidth = CANVAS_WIDTH / TABS.length;
        const logicalX = screenX / scaleX;

        for (let i = 0; i < TABS.length; i++) {
            if (logicalX >= i * tabWidth && logicalX < (i + 1) * tabWidth) {
                this.onSwitch(TABS[i].id);
                break;
            }
        }
    }

    render(activeScene) {
        const ctx = this.ctx;
        const tabWidth = CANVAS_WIDTH / TABS.length;

        for (let i = 0; i < TABS.length; i++) {
            const tab = TABS[i];
            const x = i * tabWidth;
            const active = tab.id === activeScene;

            // Background
            if (active) {
                ctx.fillStyle = COLORS.uiAccent;
            } else {
                ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
            }
            ctx.fillRect(x, 0, tabWidth, TAB_HEIGHT);

            // Border bottom
            ctx.strokeStyle = COLORS.uiBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, 0, tabWidth, TAB_HEIGHT);

            // Icon + Label
            const textColor = active ? '#ffffff' : COLORS.uiTextDim;
            Renderer.drawText(ctx, `${tab.icon}  ${tab.label}`, x + tabWidth / 2, TAB_HEIGHT / 2, {
                font: 'bold 13px monospace',
                fill: textColor,
                align: 'center',
                baseline: 'middle',
            });
        }
    }
}
