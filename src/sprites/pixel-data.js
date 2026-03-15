// Pixel Art Sprite Data
// All game sprites defined as palette-indexed character grids
// '.' = transparent pixel

import { createSprite, createAnimatedSprite, flipSprite } from './sprite-renderer.js';

// ============================================================
// PALETTES
// ============================================================

const ZOMBIE_PALETTE = {
    '.': null,
    'B': '#1a1a1a', // black outline
    'G': '#3a7a2a', // green body
    'g': '#5cb54c', // light green highlight
    'D': '#2d5a1e', // dark green shadow
    'W': '#e8e8e8', // white (eyes)
    'P': '#111111', // pupils
    'R': '#cc3333', // red (mouth/blood)
    'r': '#992222', // dark red
    'Y': '#d4c832', // yellow (hard hat)
    'y': '#b0a828', // dark yellow
    'T': '#8B6914', // wood/plank brown
    't': '#6B4226', // dark wood
    'S': '#a0a0a0', // speed lines (sprinter)
    'F': '#5a3a1e', // flesh/darker skin variant
};

const ENV_PALETTE = {
    '.': null,
    'B': '#1a1a1a', // black
    'b': '#2a2a2a', // dark gray
    'S': '#6B6B6B', // stone gray
    's': '#555555', // dark stone
    'K': '#4a4a4a', // darker stone
    'W': '#8a8a7a', // wall stone
    'w': '#6a6a5a', // wall dark
    'G': '#3a7a2a', // grass green
    'g': '#2d5a1e', // dark grass
    'E': '#5cb54c', // bright grass
    'T': '#8B6914', // wood brown
    't': '#6B4226', // dark wood
    'L': '#a08040', // light wood
    'P': '#7a5a3a', // path brown
    'p': '#5a3a1a', // dark path
    'R': '#cc3333', // red
    'O': '#e67e22', // orange (fire)
    'o': '#cc6600', // dark orange
    'Y': '#f1c40f', // yellow (fire tip)
    'y': '#d4a800', // dark yellow
    'C': '#3a2a1a', // cliff brown
    'c': '#2a1a0a', // cliff dark
    'M': '#d4d4cc', // moon
    'm': '#b0b0a8', // moon shadow
    'I': '#c0c0b8', // iron gate
    'i': '#808078', // dark iron
    'N': '#1a1a2e', // night sky dark
    'n': '#2d1b4e', // night purple
    'F': '#aa4400', // flame
};

const UI_PALETTE = {
    '.': null,
    'B': '#1a1a1a', // black
    'b': '#333333', // dark gray
    'W': '#ffffff', // white
    'w': '#cccccc', // light gray
    'G': '#4CAF50', // green
    'g': '#388E3C', // dark green
    'O': '#e67e22', // orange
    'o': '#cc6600', // dark orange
    'R': '#cc3333', // red
    'r': '#992222', // dark red
    'Y': '#f1c40f', // yellow
    'y': '#d4a800', // dark yellow
    'U': '#5dade2', // blue
    'u': '#3498db', // dark blue
    'S': '#6B6B6B', // gray
    's': '#555555', // dark gray
};

const PROJECTILE_PALETTE = {
    '.': null,
    'B': '#1a1a1a', // black outline
    'G': '#888888', // gray (boulder)
    'g': '#666666', // dark gray
    'H': '#aaaaaa', // highlight
    'O': '#e67e22', // orange (fire)
    'o': '#cc4400', // dark orange
    'Y': '#f1c40f', // yellow
    'R': '#cc3333', // red
    'U': '#5dade2', // ice blue
    'u': '#3498db', // dark blue
    'W': '#e8e8e8', // white/ice highlight
    'M': '#f1c40f', // mega yellow
    'm': '#d4a800', // mega dark
    'F': '#ff6600', // fire core
};

// ============================================================
// ZOMBIE SPRITES (10x14 pixels, 2 walk frames per type)
// ============================================================

const ZOMBIE_SHAMBLER_F1 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '.BGGGGGB..',
    '.BGDGDGB..',
    '..BGGGGB..',
    '..BGG.BGB.',
    '..BGB..BGB',
    '..BB....BB',
];

const ZOMBIE_SHAMBLER_F2 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '.BGGGGGB..',
    '.BGDGDGB..',
    '..BGGGGB..',
    '.BGB.BGGB.',
    'BGB...BGB.',
    'BB.....BB.',
];

const ZOMBIE_SPRINTER_F1 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '..BGGGB...',
    '..BGDGB...',
    '...BGGB...',
    '...BG.BGB.',
    '...BB..BGB',
    '........BB',
];

const ZOMBIE_SPRINTER_F2 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '..BGGGB...',
    '..BGDGB...',
    '...BGGB...',
    '.BGB.BGB..',
    'BGB...BB..',
    'BB........',
];

const ZOMBIE_BRUTE_F1 = [
    '..BBBBBB..',
    '.BDDggDDB.',
    'BDGGWGWgDB',
    'BDGGPGPGDB',
    'BDGGGGGGdB',
    '.BDgRRgDB.',
    '..BBBBBB..',
    '.BDDGGDDB.',
    'BDDDGGGDB.',
    'BDDDDDDDB.',
    '.BDDGGDDB.',
    '.BDDG.BDB.',
    '.BDDB..BDB',
    '..BB....BB',
];

const ZOMBIE_BRUTE_F2 = [
    '..BBBBBB..',
    '.BDDggDDB.',
    'BDGGWGWgDB',
    'BDGGPGPGDB',
    'BDGGGGGGdB',
    '.BDgRRgDB.',
    '..BBBBBB..',
    '.BDDGGDDB.',
    'BDDDGGGDB.',
    'BDDDDDDDB.',
    '.BDDGGDDB.',
    '.BDB.BDDB.',
    '.BDB..BDB.',
    '..BB...BB.',
];

const ZOMBIE_ENGINEER_F1 = [
    '.BYYYYYYB.',
    '.ByyyyyYB.',
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '.BGGGGGB..',
    '..BGGGGB..',
    '..BGG.BGB.',
    '..BGB..BGB',
    '..BB....BB',
];

const ZOMBIE_ENGINEER_F2 = [
    '.BYYYYYYB.',
    '.ByyyyyYB.',
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '..BgRRgB..',
    '...BBBB...',
    '..BGGGGB..',
    '.BGGGGGB..',
    '..BGGGGB..',
    '.BGB.BGGB.',
    'BGB...BGB.',
    'BB.....BB.',
];

const ZOMBIE_CARRIER_F1 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgBt',
    '..BgRRgBTt',
    '...BBBBBTt',
    '..BGGGGBTB',
    '.BGGGGGBTB',
    '.BGDGDGB.B',
    '..BGGGGB..',
    '..BGG.BGB.',
    '..BGB..BGB',
    '..BB....BB',
];

const ZOMBIE_CARRIER_F2 = [
    '...BBBB...',
    '..BggggB..',
    '.BgGWGWgB.',
    '.BgGPGPgB.',
    '.BgGGGGgBt',
    '..BgRRgBTt',
    '...BBBBBTt',
    '..BGGGGBTB',
    '.BGGGGGBTB',
    '.BGDGDGB.B',
    '..BGGGGB..',
    '.BGB.BGGB.',
    'BGB...BGB.',
    'BB.....BB.',
];

// ============================================================
// CATAPULT SPRITES (24x20 pixels)
// ============================================================

const CATAPULT_PALETTE = {
    '.': null,
    'B': '#1a1a1a',
    'T': '#8B6914', // wood
    't': '#6B4226', // dark wood
    'L': '#a08040', // light wood
    'S': '#555555', // stone
    's': '#444444', // dark stone
    'K': '#666666', // stone highlight
    'R': '#8B0000', // rope
    'r': '#660000', // dark rope
    'I': '#808080', // iron
};

const CATAPULT_BASE = [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '......B..........B......',
    '.....BTB........BTB.....',
    '....BTTB......BTTB.....',
    '...BTTTB....BTTTB......',
    '..BTTLTBBBBBTTtTB......',
    '.BTTTLTTTTTTTTTB.......',
    '.BTTLTTTTTTTTtTB.......',
    '.BTTTTTTTTTTTTB........',
    'BSSSSSSSSSSSSSSB.......',
    'BsKSSSSSSSSSKsSB.......',
    'BsSSSSSSSSSSSsSB.......',
    'BBBBBBBBBBBBBBBB.......',
];

const CATAPULT_ARM = [
    'BRRB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BTTB',
    'BLLB',
    'BTTB',
    'BTTB',
    'BTTB',
];

const CATAPULT_SLING = [
    '.BRRB.',
    'BRrrRB',
    'BRrrRB',
    '.BRRB.',
];

// ============================================================
// BRIDGE PLANKS (different materials)
// ============================================================

const BRIDGE_PALETTE = {
    '.': null,
    'B': '#1a1a1a',
    'T': '#8B6914', // rope bridge wood
    't': '#6B4226', // dark wood
    'W': '#7a5a3a', // wooden bridge
    'w': '#5a3a1a', // dark wooden
    'S': '#777777', // stone
    's': '#555555', // dark stone
    'K': '#999999', // stone highlight
    'R': '#8B6914', // rope
    'r': '#6B4226', // dark rope
    'L': '#a08040', // light wood highlight
};

const PLANK_ROPE = [
    'BTTTTTTTB',
    'BTLTTtTTB',
    'BTTTtTLTB',
    'BTTTTTTTB',
];

const PLANK_WOOD = [
    'BWWWWWWWB',
    'BWLWWwWWB',
    'BWWWwWLWB',
    'BWWWWWWWB',
];

const PLANK_STONE = [
    'BSSSSSSSSB',
    'BSKSSsSSSB',
    'BSSsSSSKSB',
    'BSSSSSSSSB',
];

const ROPE_SEGMENT = [
    'BR',
    'RB',
];

// ============================================================
// CASTLE SPRITES
// ============================================================

const CASTLE_WALL_TILE = [
    'BWWWWWWWB',
    'BWWWWwWWB',
    'BWwWWWWwB',
    'BWWWWWWWB',
    'BWWwWWWWB',
    'BWWWWWwWB',
    'BWwWWWWWB',
    'BWWWWWWWB',
];

const CASTLE_MERLON = [
    'BWWWWB',
    'BWwWWB',
    'BWWWWB',
    'BWWwWB',
    'BBBBBB',
];

const CASTLE_GATE = [
    'BIIIIIIIIIB',
    'BIBiIBiIBIB',
    'BIIIIIIIIIB',
    'BIBiIBiIBIB',
    'BIIIIIIIIIB',
    'BIBiIBiIBIB',
    'BIIIIIIIIIB',
    'BIBiIBiIBIB',
    'BIIIIIIIIIB',
    'BBBBBBBBBBB',
];

const TORCH = [
    '..YO..',
    '.YOOY.',
    '.OFFO.',
    '..OO..',
    '..BB..',
    '..BB..',
    '..BB..',
    '..BB..',
];

const TORCH_F2 = [
    '.YO...',
    'YOOY..',
    '.OFFO.',
    '..OO..',
    '..BB..',
    '..BB..',
    '..BB..',
    '..BB..',
];

// ============================================================
// TREE SPRITES
// ============================================================

const DEAD_TREE_1 = [
    '......B.....',
    '..B..BBB....',
    '..BB.B.B.B..',
    '...BBB.BBB..',
    '....BB.B....',
    '....BBB.....',
    '.B..BB......',
    '.BB.BB......',
    '..BBBB......',
    '...BBB......',
    '...BBB......',
    '...BBB......',
    '...BBB......',
    '...BBB......',
    '..BtttB.....',
    '.BtttttB....',
];

const DEAD_TREE_2 = [
    '.....B......',
    '....BBB..B..',
    '...B.B..BB..',
    '...BBB.BB...',
    '....BBBB....',
    '.B..BB......',
    '.BB.BB......',
    '..BBBB......',
    '...BBB......',
    '...BBB......',
    '...BBB......',
    '...BBB......',
    '..BtttB.....',
    '.BtttttB....',
];

const BUSH = [
    '.BgGgB.',
    'BgGEGgB',
    'BGEGEgB',
    'BgGEGGB',
    '.BgGgB.',
];

// ============================================================
// PROJECTILE SPRITES (6x6)
// ============================================================

const BOULDER = [
    '.BBBB.',
    'BGHgGB',
    'BGGgGB',
    'BGGggB',
    'BgGggB',
    '.BBBB.',
];

const FIREBALL = [
    '.BBBB.',
    'BOYoOB',
    'BOFYoB',
    'BYFFoB',
    'BOOooB',
    '.BBBB.',
];

const ICEBOMB = [
    '.BBBB.',
    'BUWuUB',
    'BUWWuB',
    'BWUUuB',
    'BUUuuB',
    '.BBBB.',
];

const MEGABOMB = [
    '.BBBB.',
    'BMYmMB',
    'BMYYmB',
    'BYMMmB',
    'BMMmmB',
    '.BBBB.',
];

// ============================================================
// MOON
// ============================================================

const MOON_PALETTE = {
    '.': null,
    'M': '#d4d4cc',
    'm': '#b8b8b0',
    'D': '#9a9a92',
    'B': '#1a1a2e', // sky color for crescent shadow
};

const MOON = [
    '...MMMM...',
    '.MMMmmMM..',
    'MMMmDDmMM.',
    'MMmDDDmMMB',
    'MMmDDmMMBB',
    'MMMmDmMBBB',
    'MMMmmMMBBB',
    '.MMMMMBBB.',
    '..MMMBBBB.',
    '...MMBB...',
];

// ============================================================
// STAR
// ============================================================

const STAR_PALETTE = {
    '.': null,
    'W': '#ffffff',
    'w': '#cccccc',
};

const STAR_SPRITE = [
    '.W.',
    'WwW',
    '.W.',
];

// ============================================================
// UI SPRITES
// ============================================================

const STAR_FILLED = [
    '....YY....',
    '...YYYY...',
    '..YYYYYY..',
    'BYYYYYYYY.',
    '.BYYYYYY..',
    '..BYYYYY..',
    '.BYYBYYYB.',
    'BYY...BYYB',
    'BY......BY',
];

const STAR_EMPTY = [
    '....BB....',
    '...B..B...',
    '..B....B..',
    '.B......B.',
    'B........B',
    '.B......B.',
    '..B..B..B.',
    '.B.B...B.B',
    'B.......B.',
];

const LOCK_ICON = [
    '..BBBB..',
    '.BB..BB.',
    '.B....B.',
    '.BB..BB.',
    'BBBBBBBB',
    'BssssssB',
    'BssWWssB',
    'BssWWssB',
    'BssssssB',
    'BBBBBBBB',
];

const SKULL_ICON = [
    '..BBBB..',
    '.BWWWWB.',
    'BWBWWBWB',
    'BWW..WWB',
    '.BWWWWB.',
    '..BWWB..',
    '.BWBWBB.',
    '..BBBB..',
];

// ============================================================
// CLIFF / TERRAIN TILES (8x8)
// ============================================================

const CLIFF_TILE = [
    'CCCCCCCC',
    'CcCCCcCC',
    'CCCcCCCC',
    'CcCCCCcC',
    'CCCCcCCC',
    'CcCCCCCC',
    'CCcCCcCC',
    'CCCCCCCC',
];

const PATH_TILE = [
    'PPPPPPPP',
    'PpPPPpPP',
    'PPPpPPPP',
    'PpPPPPpP',
    'PPPPpPPP',
    'PpPPPPPP',
    'PPpPPpPP',
    'PPPPPPPP',
];

const GRASS_TILE = [
    'ggGgGggg',
    'gGgEgGgg',
    'ggGgGgGg',
    'gEgGgEgg',
    'ggGgGggg',
    'gGgEgGEg',
    'ggGgGggg',
    'gGgGgEgg',
];

// ============================================================
// SKY GRADIENT TILES (8x1 strips)
// ============================================================

const SKY_PALETTE = {
    '.': null,
    'A': '#0a0a1a',
    'B': '#0f0f24',
    'C': '#14142e',
    'D': '#191938',
    'E': '#1e1e42',
    'F': '#23234c',
    'G': '#2d1b4e',
};

// ============================================================
// PARTICLE SPRITES (tiny 2-4px)
// ============================================================

const DUST_PARTICLE = [
    'PP',
    'Pp',
];

const SPLINTER_PARTICLE = [
    'TL',
    'tT',
];

const IMPACT_PARTICLE = [
    'SS',
    'sS',
];

const SPARK_PARTICLE = [
    'YO',
    'OY',
];

// ============================================================
// EXPORT: Compiled sprite canvases
// ============================================================

let _sprites = null;

export function getSprites() {
    if (_sprites) return _sprites;
    _sprites = buildSprites();
    return _sprites;
}

function buildSprites() {
    const sprites = {};

    // Zombies
    sprites.zombie = {
        shambler: createAnimatedSprite(ZOMBIE_PALETTE, [ZOMBIE_SHAMBLER_F1, ZOMBIE_SHAMBLER_F2]),
        sprinter: createAnimatedSprite(ZOMBIE_PALETTE, [ZOMBIE_SPRINTER_F1, ZOMBIE_SPRINTER_F2]),
        brute: createAnimatedSprite(ZOMBIE_PALETTE, [ZOMBIE_BRUTE_F1, ZOMBIE_BRUTE_F2]),
        engineer: createAnimatedSprite(ZOMBIE_PALETTE, [ZOMBIE_ENGINEER_F1, ZOMBIE_ENGINEER_F2]),
        carrier: createAnimatedSprite(ZOMBIE_PALETTE, [ZOMBIE_CARRIER_F1, ZOMBIE_CARRIER_F2]),
    };

    // Catapult
    sprites.catapult = {
        base: createSprite(CATAPULT_PALETTE, CATAPULT_BASE),
        arm: createSprite(CATAPULT_PALETTE, CATAPULT_ARM),
        sling: createSprite(CATAPULT_PALETTE, CATAPULT_SLING),
    };

    // Bridges
    sprites.bridge = {
        rope: createSprite(BRIDGE_PALETTE, PLANK_ROPE),
        wood: createSprite(BRIDGE_PALETTE, PLANK_WOOD),
        stone: createSprite(BRIDGE_PALETTE, PLANK_STONE),
        ropeSegment: createSprite(BRIDGE_PALETTE, ROPE_SEGMENT),
    };

    // Castle
    sprites.castle = {
        wallTile: createSprite(ENV_PALETTE, CASTLE_WALL_TILE),
        merlon: createSprite(ENV_PALETTE, CASTLE_MERLON),
        gate: createSprite(ENV_PALETTE, CASTLE_GATE),
        torch: createAnimatedSprite(ENV_PALETTE, [TORCH, TORCH_F2]),
    };

    // Environment
    sprites.env = {
        deadTree1: createSprite(ENV_PALETTE, DEAD_TREE_1),
        deadTree2: createSprite(ENV_PALETTE, DEAD_TREE_2),
        bush: createSprite(ENV_PALETTE, BUSH),
        moon: createSprite(MOON_PALETTE, MOON),
        star: createSprite(STAR_PALETTE, STAR_SPRITE),
        cliffTile: createSprite(ENV_PALETTE, CLIFF_TILE),
        pathTile: createSprite(ENV_PALETTE, PATH_TILE),
        grassTile: createSprite(ENV_PALETTE, GRASS_TILE),
    };

    // Projectiles
    sprites.projectile = {
        boulder: createSprite(PROJECTILE_PALETTE, BOULDER),
        fireball: createSprite(PROJECTILE_PALETTE, FIREBALL),
        icebomb: createSprite(PROJECTILE_PALETTE, ICEBOMB),
        megabomb: createSprite(PROJECTILE_PALETTE, MEGABOMB),
    };

    // Particles
    sprites.particle = {
        dust: createSprite(ENV_PALETTE, DUST_PARTICLE),
        splinter: createSprite(ENV_PALETTE, SPLINTER_PARTICLE),
        impact: createSprite(ENV_PALETTE, IMPACT_PARTICLE),
        spark: createSprite(ENV_PALETTE, SPARK_PARTICLE),
    };

    // UI
    sprites.ui = {
        starFilled: createSprite(UI_PALETTE, STAR_FILLED),
        starEmpty: createSprite(UI_PALETTE, STAR_EMPTY),
        lock: createSprite(UI_PALETTE, LOCK_ICON),
        skull: createSprite(UI_PALETTE, SKULL_ICON),
    };

    return sprites;
}
