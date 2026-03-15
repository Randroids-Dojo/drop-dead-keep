// ── Colors ──────────────────────────────────────────────
export const COLORS = {
    // Sky & background
    skyTop: '#0a0a2e',
    skyBottom: '#16213e',
    stars: '#ffffff',
    moon: '#e8e8d0',

    // Ground & terrain
    ground: '#5c4033',
    groundLight: '#8B7355',
    grass: '#4a7c3f',
    cliff: '#6b5b4f',

    // Castle wall
    wallLight: '#c2b280',
    wallDark: '#b8a088',
    wallShadow: '#8a7a68',

    // UI
    uiBg: '#1a1a2e',
    uiPanel: '#2a2a2a',
    uiBorder: '#3a3a4a',
    uiAccent: '#ff8c00',
    uiAccentHover: '#ffa033',
    uiText: '#ffffff',
    uiTextDim: '#888888',

    // Ammo
    boulder: '#b0b0b0',
    fireball: '#ff4500',
    iceBomb: '#4488ff',
    megaBomb: '#ffd700',

    // Enemies
    zombieGreen: '#6b8e23',
    zombieDark: '#556b2f',
    zombieSkin: '#8fbc6b',
    engineerHat: '#c2a060',
    bruteArmor: '#8B4513',
    screecherPurple: '#9b59b6',
    sprinterPale: '#a8c8a0',

    // Bridge
    bridgeWood: '#8B6914',
    bridgeDamaged: '#6b5010',
    bridgeRope: '#a08050',

    // Effects
    fire: '#ff6600',
    ice: '#88ccff',
    explosion: '#ffaa00',
    dust: '#c8b89a',

    // Gate defense
    oil: '#2244aa',
    rocks: '#888888',
    gateBar: '#cc0000',
    gateBarBg: '#440000',
};

// ── Dimensions ──────────────────────────────────────────
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

// ── Physics ─────────────────────────────────────────────
export const GRAVITY = 600;            // pixels/sec²
export const MAX_LAUNCH_SPEED = 800;   // pixels/sec
export const DRAG_SCALE = 3.5;        // drag distance → launch speed multiplier

// ── Bridge ──────────────────────────────────────────────
export const BRIDGE_HP = {
    wood: 3,
    stone: 6,
};
export const BRIDGE_STATES = {
    INTACT: 'intact',
    DAMAGED: 'damaged',
    DESTROYED: 'destroyed',
};
export const ENGINEER_REBUILD_TIME = 8; // seconds

// ── Ammo ────────────────────────────────────────────────
export const AMMO_TYPES = {
    boulder: {
        name: 'Boulder',
        color: '#b0b0b0',
        damage: 1,
        radius: 12,
        description: 'Standard. Smashes bridges, knocks zombies off.',
    },
    fireball: {
        name: 'Fireball',
        color: '#ff4500',
        damage: 2,
        radius: 14,
        areaRadius: 40,
        burnDuration: 3,
        description: 'Burns wood bridges faster. Area damage over time.',
    },
    iceBomb: {
        name: 'Ice Bomb',
        color: '#4488ff',
        damage: 1,
        radius: 13,
        freezeDuration: 4,
        areaRadius: 50,
        description: 'Freezes zombies in place. Frozen bridges are fragile.',
    },
    megaBomb: {
        name: 'Mega Bomb',
        color: '#ffd700',
        damage: 4,
        radius: 16,
        areaRadius: 80,
        description: 'Huge radius. Destroys entire bridge sections.',
    },
};

// ── Default ammo counts per wave ────────────────────────
export const DEFAULT_AMMO = {
    boulder: 12,
    fireball: 5,
    iceBomb: 3,
    megaBomb: 1,
};

// ── Enemy stats (out of 6) ──────────────────────────────
export const ENEMY_TYPES = {
    shambler: {
        name: 'Shambler',
        tier: 'Common',
        hp: 1, spd: 1, dmg: 1, arm: 0,
        color: '#6b8e23',
        description: 'Basic zombie. Slow, fragile, travels in packs. Falls easily off broken bridges. The bread and butter of every wave.',
    },
    engineer: {
        name: 'Engineer',
        tier: 'Common',
        hp: 2, spd: 2, dmg: 1, arm: 1,
        color: '#6b8e23',
        description: 'Carries planks to rebuild destroyed bridges. Must be prioritized or they undo your work.',
    },
    brute: {
        name: 'Brute',
        tier: 'Uncommon',
        hp: 4, spd: 1, dmg: 3, arm: 3,
        color: '#556b2f',
        description: 'Heavily armored. Slow but tanky. Can survive bridge collapses by clinging to edges.',
    },
    screecher: {
        name: 'Screecher',
        tier: 'Rare',
        hp: 1, spd: 3, dmg: 2, arm: 0,
        color: '#9b59b6',
        description: 'Emits a scream that speeds up nearby zombies. Fragile but dangerous in groups.',
    },
    sprinter: {
        name: 'Sprinter',
        tier: 'Rare',
        hp: 2, spd: 5, dmg: 1, arm: 0,
        color: '#a8c8a0',
        description: 'Extremely fast. Can leap small gaps in bridges. Hard to hit.',
    },
};

// ── Waves ────────────────────────────────────────────────
export const WAVES = [
    { enemies: [{ type: 'shambler', count: 8 }], ammoMultiplier: 1.0 },
    { enemies: [{ type: 'shambler', count: 10 }, { type: 'engineer', count: 2 }], ammoMultiplier: 0.93 },
    { enemies: [{ type: 'shambler', count: 12 }, { type: 'engineer', count: 3 }, { type: 'brute', count: 1 }], ammoMultiplier: 0.87 },
    { enemies: [{ type: 'shambler', count: 12 }, { type: 'engineer', count: 3 }, { type: 'screecher', count: 2 }, { type: 'brute', count: 2 }], ammoMultiplier: 0.8 },
    { enemies: [{ type: 'shambler', count: 10 }, { type: 'engineer', count: 4 }, { type: 'brute', count: 3 }, { type: 'screecher', count: 2 }, { type: 'sprinter', count: 3 }], ammoMultiplier: 0.7 },
];

// ── Gate Defense ─────────────────────────────────────────
export const GATE_MAX_HP = 100;
export const GATE_HOLD_TIME = 45; // seconds

export const GATE_DEFENSES = {
    oil: { name: 'Oil', uses: 5, slowFactor: 0.3, radius: 40 },
    rocks: { name: 'Rocks', uses: 6, damage: 3, radius: 25 },
    fire: { name: 'Fire', uses: 3, damagePerSec: 2, radius: 35, duration: 5 },
};
