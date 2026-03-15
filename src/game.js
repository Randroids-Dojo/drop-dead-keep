import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { SlingshotScene } from './scenes/slingshot.js';
import { GateDefenseScene } from './scenes/gateDefense.js';
import { BestiaryScene } from './scenes/bestiary.js';
import { WorldArtScene } from './scenes/worldArt.js';
import { UI } from './ui.js';

// ── Game state ──────────────────────────────────────────
const state = {
    scene: 'slingshot',  // slingshot | gateDefense | bestiary | worldArt
    wave: 0,
    score: 0,
    paused: false,
};

let canvas, ctx, renderer, input, ui;
let scenes = {};
let lastTime = 0;

// ── Public init ─────────────────────────────────────────
export function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    renderer = new Renderer(ctx);
    input = new Input(canvas);
    ui = new UI(canvas, ctx, switchScene);

    scenes = {
        slingshot: new SlingshotScene(ctx, input, state),
        gateDefense: new GateDefenseScene(ctx, input, state),
        bestiary: new BestiaryScene(ctx, input, state),
        worldArt: new WorldArtScene(ctx, input, state),
    };

    requestAnimationFrame(loop);
}

// ── Resize canvas to fill window ────────────────────────
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}

// ── Scene switching ─────────────────────────────────────
function switchScene(name) {
    if (scenes[name]) {
        state.scene = name;
    }
}

// ── Main loop ───────────────────────────────────────────
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;

    // Scale context to match logical resolution
    const scaleX = canvas.width / CANVAS_WIDTH;
    const scaleY = canvas.height / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - CANVAS_WIDTH * scale) / 2;
    const offsetY = (canvas.height - CANVAS_HEIGHT * scale) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Update input coordinates to logical space
    input.setTransform(offsetX, offsetY, scale);

    // Update & render active scene
    const scene = scenes[state.scene];
    if (scene) {
        scene.update(dt);
        scene.render();
    }

    // Render tab bar on top
    ui.render(state.scene);

    ctx.restore();

    requestAnimationFrame(loop);
}
