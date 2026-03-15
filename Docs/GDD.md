# Castle Siege: Bridge Breaker — Game Design Document

## 1. Concept

**Tagline:** Fling boulders from your castle walls to shatter bridges and send the undead tumbling into the abyss before they rebuild and reach your gates.

**Elevator Pitch:** Angry Birds meets Plants vs Zombies. You defend a hilltop castle by launching projectiles at a winding series of bridges that zombies must cross to reach you. Destroy the bridges; destroy the horde. But engineers rebuild what you break, so every shot counts.

**Platform:** Web (HTML5 Canvas), desktop & mobile browsers
**Engine:** Vanilla JavaScript + HTML5 Canvas (no framework)
**Deployment:** Vercel (static site + optional serverless functions)

---

## 2. Core Loop

```
WAVE START
  │
  ▼
Zombies spawn at the bottom of the hill
  │
  ▼
They walk upward along winding cliff paths connected by bridges
  │
  ▼
Player fires projectiles (slingshot/catapult) to destroy bridges
  │
  ▼
Zombies fall into chasms ─── OR ─── Engineers rebuild bridges
  │                                        │
  ▼                                        ▼
Survivors reach the castle gate ──► GATE DEFENSE mini-game
  │
  ▼
Survive the timer → WAVE COMPLETE → Next wave (harder)
  │
  FAIL → Game Over
```

---

## 3. Game Modes

### 3.1 Slingshot Mode (Primary)

The main gameplay view. A side-on perspective of the hillside showing the winding path from the base up to the castle.

**Controls:**
- Drag back from the catapult to aim (like Angry Birds)
- Trajectory preview arc shows predicted landing
- Release to fire
- Select ammo types from the toolbar along the castle wall

**Camera:** Fixed side view of the full hill. Slight parallax scrolling on the night-sky background.

**HUD Elements:**
- Ammo selector (bottom-left): shows ammo type icons with remaining count
- Instructions bar (bottom): "DRAG FROM CATAPULT TO AIM : RELEASE TO FIRE"

### 3.2 Gate Defense Mode (Secondary)

Triggered when zombies reach the castle wall. The perspective shifts to a **top-down** view looking straight down from the battlements.

**Controls:**
- Tap/click below the wall to deploy defenses onto the horde
- Select defense type from toolbar

**Defense Types:**
| Defense | Effect |
|---------|--------|
| Oil | Slows zombies, can be ignited |
| Rocks | Direct damage, small area |
| Fire | Area damage over time |

**Win Condition:** Survive the countdown timer (e.g., "HOLD 0:34")
**Fail Condition:** Gate HP reaches 0% (shown as red health bar: "GATE 28%")

**HUD Elements:**
- Gate health bar (bottom-center)
- Hold timer (bottom-right)
- Defense selector with remaining uses (bottom toolbar)

---

## 4. Ammunition Types

| Ammo | Color | Icon | Effect | Rarity |
|------|-------|------|--------|--------|
| **Boulder** | Gray | ⚪ | Standard. Smashes bridges, knocks zombies off. | Common (12) |
| **Fireball** | Red/Orange | 🔴 | Burns wood bridges faster. Area damage over time. | Uncommon (5) |
| **Ice Bomb** | Blue | 🔵 | Freezes zombies in place. Frozen bridges are fragile. | Rare (3) |
| **Mega Bomb** | Gold | 🟡 | Huge radius. Destroys entire bridge sections. | Epic (1) |

Ammo counts refresh each wave. Higher waves may provide fewer total shots to increase difficulty.

---

## 5. Enemy Bestiary

### 5.1 Enemy Types

| Type | Tier | HP | SPD | DMG | ARM | Description |
|------|------|----|-----|-----|-----|-------------|
| **Shambler** | Common | 1/6 | 1/6 | 1/6 | 0/6 | Basic zombie. Slow, fragile, travels in packs. Falls easily off broken bridges. The bread and butter of every wave. |
| **Engineer** | Common | 2/6 | 2/6 | 1/6 | 1/6 | Core mechanic enemy. Carries planks to rebuild destroyed bridges. Must be prioritized or they undo your work. |
| **Brute** | Uncommon | 4/6 | 1/6 | 3/6 | 3/6 | Heavily armored. Slow but tanky. Can survive bridge collapses by clinging to edges. |
| **Screecher** | Rare | 1/6 | 3/6 | 2/6 | 0/6 | Emits a scream that speeds up nearby zombies. Fragile but dangerous in groups. Purple/translucent appearance. |
| **Sprinter** | Rare | 2/6 | 5/6 | 1/6 | 0/6 | Extremely fast. Can leap small gaps in bridges. Hard to hit. |

### 5.2 Engineer Rebuild Mechanic

Engineers are the core strategic tension. When they reach a destroyed bridge:

1. **Arrives** — Stops at the gap edge
2. **Places Plank** — Lays a wooden plank across (progress bar starts, ~25%)
3. **Hammers** — Actively hammers the plank into place (~50-75%)
4. **Complete** — Bridge section restored (progress bar full, 100%)

Players must interrupt this 4-step sequence by hitting the engineer or destroying the plank. If left alone, the bridge is rebuilt and the horde continues.

---

## 6. Destructible Bridges

Bridges are the central mechanic. They connect cliff-path segments on the hillside.

### 6.1 Bridge States

| State | Visual | Gameplay |
|-------|--------|----------|
| **Intact** | Full wooden plank bridge with railings | Zombies walk across normally |
| **Damaged** | Cracked/splintered, planks askew | Zombies slow down, some fall through |
| **Destroyed** | Only broken stubs remain | Impassable — zombies fall into the chasm |

### 6.2 Bridge Properties

- **Material:** Wood (standard), Stone (later levels — takes more hits)
- **Segments:** Large bridges may have 2-3 independently destructible segments
- **Rebuild:** Only engineers can rebuild. Takes ~8 seconds uninterrupted
- **Frozen bridges** (hit by Ice Bomb) become fragile — one more hit shatters them

---

## 7. Terrain & Environment

### 7.1 Map Layout

The hillside is a winding S-curve path from bottom to top:

```
    ┌─────────────────┐
    │    🏰 CASTLE    │  ← Player's castle (top)
    │    ═══════      │
    │         │       │
    │    ─────┘       │  ← Bridge 4
    │    │            │
    │    └─────       │  ← Bridge 3
    │          │      │
    │    ──────┘      │  ← Bridge 2
    │    │            │
    │    └──────      │  ← Bridge 1
    │           │     │
    │    🧟 SPAWN     │  ← Zombie spawn (bottom)
    └─────────────────┘
```

Each bridge is a choke point. The winding path forces zombies to cross multiple bridges, giving the player several opportunities to stop them.

### 7.2 Terrain Elements

| Element | Visual | Function |
|---------|--------|----------|
| **Cliff Path** | Brown dirt/rock ledge with grass tufts | Walkable path for zombies |
| **Dead Tree** | Bare branching tree | Decorative, can be destroyed for visual flair |
| **Wall Torch** | Flickering flame on stick | Provides light near castle, decorative |
| **Battlement** | Stone crenellation block | Castle wall decoration, part of defense line |

### 7.3 Atmosphere

- **Time of day:** Night (dark purple-blue sky gradient)
- **Sky elements:** Crescent moon, scattered stars (twinkling)
- **Lighting:** Warm torchlight along the castle wall, cool moonlight on the hillside
- **Parallax layers:** Sky → distant mountains → hillside → foreground wall

---

## 8. Art Style

**Style:** Cartoony 2D with thick outlines and vibrant colors against dark backgrounds.

**Color Palette:**
- **Background:** Deep navy/purple (#1a1a2e → #16213e gradient)
- **Ground/Paths:** Warm browns (#5c4033, #8B7355)
- **Castle Wall:** Sandy stone (#b8a088, #c2b280)
- **UI Chrome:** Dark charcoal (#2a2a2a) with orange accents (#ff8c00)
- **Text:** White (#ffffff) headers, orange (#ff8c00) labels
- **Enemies:** Green skin tones (#6b8e23, #556b2f) with varied accessories

**Rendering:**
- All art is programmatically drawn on Canvas 2D (no sprite sheets)
- Thick black outlines (2-3px) on all game objects
- Simple geometric shapes composed into characters
- Smooth animations via requestAnimationFrame

**Font:** Monospace / pixel-style for all UI text (consistent with the retro-game aesthetic shown in the mockups)

---

## 9. UI Design

### 9.1 Tab Navigation

Four main tabs across the top (shown in mockups):

| Tab | Icon | Purpose |
|-----|------|---------|
| **Slingshot** | 🎯 | Main gameplay — firing projectiles |
| **Gate Defense** | 🏰 | Wall defense mini-game |
| **Bestiary** | 💀 | Enemy encyclopedia |
| **World Art** | 🌍 | Visual asset gallery |

Active tab: Orange background (#ff8c00) with white text
Inactive tabs: Transparent with gray text

### 9.2 Bestiary Screen

- Left panel: Scrollable list of enemy thumbnails with names
- Center: Large animated preview of selected enemy
- Right panel: Enemy name, tier, description, and stat bars (HP/SPD/DMG/ARM)
- Stat bars: 6-pip system, filled pips are green (#6b8e23)

### 9.3 World Art Screen

Showcases all visual assets organized by category:
- **Destructible Bridge:** Shows all 3 states side by side
- **Ammunition:** All 4 ammo types with descriptions
- **Terrain Elements:** Decorative and functional terrain pieces
- **Engineer Rebuild Sequence:** 4-step storyboard with progress bars

---

## 10. Wave Design

### 10.1 Wave Progression

| Wave | Enemies | Composition | Ammo Budget | Notes |
|------|---------|-------------|-------------|-------|
| 1 | 8 | Shamblers only | 15 | Tutorial wave |
| 2 | 12 | Shamblers + 2 Engineers | 14 | Introduces engineers |
| 3 | 16 | Shamblers + 3 Engineers + 1 Brute | 13 | Introduces brutes |
| 4 | 20 | Mixed + Screecher | 12 | Speed buff pressure |
| 5 | 25 | All types, multiple engineers | 10 | First real challenge |
| 6+ | 25+ | Escalating difficulty | 8-10 | Endgame |

### 10.2 Scoring

- Points per zombie eliminated
- Bonus for bridge-collapse multi-kills
- Bonus for unused ammo at wave end
- Combo multiplier for rapid kills
- Wave completion time bonus

---

## 11. Technical Architecture

### 11.1 Project Structure

```
drop-dead-keep/
├── Docs/
│   └── GDD.md                 # This document
├── src/
│   ├── game.js                # Main game loop & state machine
│   ├── renderer.js            # Canvas rendering engine
│   ├── input.js               # Mouse/touch input handling (drag-to-aim)
│   ├── physics.js             # Projectile trajectories, collisions, gravity
│   ├── entities/
│   │   ├── projectile.js      # Ammo types and flight behavior
│   │   ├── zombie.js          # Base zombie class
│   │   ├── engineer.js        # Engineer rebuild behavior
│   │   ├── bridge.js          # Bridge state & destruction
│   │   └── catapult.js        # Catapult/slingshot launcher
│   ├── scenes/
│   │   ├── slingshot.js       # Main slingshot gameplay scene
│   │   ├── gateDefense.js     # Gate defense mini-game scene
│   │   ├── bestiary.js        # Enemy encyclopedia UI
│   │   └── worldArt.js        # Art gallery UI
│   ├── ui.js                  # HUD, menus, tab navigation
│   ├── audio.js               # Sound effects & music
│   └── constants.js           # Game balance values, colors, sizes
├── index.html                 # Entry point
├── styles.css                 # Global styles
├── package.json               # Dependencies & scripts
├── vercel.json                # Vercel deployment config
└── .gitignore
```

### 11.2 Tech Stack

- **Language:** Vanilla JavaScript (ES modules)
- **Rendering:** HTML5 Canvas 2D API
- **Physics:** Custom lightweight physics (parabolic trajectories, AABB collision)
- **State Management:** Simple state machine (menu → slingshot → gate defense → results)
- **Build:** No build step — served directly as static files
- **Deployment:** Vercel static hosting
- **Dev Server:** `vercel dev` for local development

### 11.3 Game Loop

```javascript
// Core loop pattern
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);   // Physics, AI, state transitions
    render();     // Canvas draw calls

    requestAnimationFrame(gameLoop);
}
```

### 11.4 Key Systems

**Slingshot Physics:**
- Drag vector → launch velocity (inverted, like Angry Birds)
- Parabolic trajectory: `y = y0 + vy*t + 0.5*g*t²`
- Trajectory preview: dotted arc drawn during drag
- Impact detection: circle-vs-rectangle for bridge/zombie hits

**Zombie Pathfinding:**
- Predefined waypoint path (no A* needed — single winding route)
- Zombies follow path segments sequentially
- At destroyed bridges: stop, queue up, or fall (based on type)
- Engineers: divert to nearest destroyed bridge

**Bridge Destruction:**
- HP-based system per bridge segment
- Visual interpolation between states (intact → damaged → destroyed)
- Particle effects on destruction (wood splinters, dust)
- Collision box removed when destroyed (zombies fall through)

---

## 12. Controls

### 12.1 Desktop (Mouse)

| Action | Input |
|--------|-------|
| Aim | Click & drag backward from catapult |
| Fire | Release mouse button |
| Select ammo | Click ammo icon in toolbar |
| Deploy defense (gate mode) | Click on ground below wall |
| Navigate tabs | Click tab headers |

### 12.2 Mobile (Touch)

| Action | Input |
|--------|-------|
| Aim | Touch & drag backward from catapult |
| Fire | Release touch |
| Select ammo | Tap ammo icon |
| Deploy defense | Tap on ground below wall |
| Navigate tabs | Tap tab headers |

---

## 13. Audio Design

| Category | Description |
|----------|-------------|
| **Ambient** | Night wind, distant owl hoots, crackling torches |
| **Launch** | Catapult creak + whoosh |
| **Impact** | Wood crunch (bridge), splat (zombie), explosion (fireball) |
| **Bridge Collapse** | Splintering wood + rumble |
| **Zombie** | Groans, shuffling feet, screecher wail |
| **Engineer** | Hammering sounds during rebuild |
| **Gate Defense** | Sizzling oil, crashing rocks, roaring fire |
| **Music** | Dark medieval loop, intensifying with wave progression |

---

## 14. Future Features (Post-MVP)

- **Level progression:** Multiple hillside maps with different layouts
- **Special abilities:** Temporary power-ups (rapid fire, earthquake, etc.)
- **Boss zombies:** Giant enemies that require multiple direct hits
- **Upgrade system:** Improve catapult range, unlock new ammo types
- **Leaderboard:** Global high scores via Vercel KV
- **Day/night cycle:** Different enemy types spawn at different times
- **Weather effects:** Rain makes bridges slippery, fog reduces visibility

---

## 15. MVP Scope

For the initial release, implement:

1. **Slingshot scene** with working drag-to-aim mechanic
2. **Boulder ammo** (single type to start)
3. **Shambler + Engineer** enemies (2 types)
4. **3 bridges** on a winding hillside path
5. **Bridge destruction** (3 states) with engineer rebuild
6. **Basic wave system** (3 waves)
7. **Score display** and wave counter
8. **Bestiary screen** (read-only enemy info)
9. **World Art screen** (asset showcase)
10. **Gate Defense stub** (simple version)

---

## 16. References

- **Angry Birds** — Slingshot aiming mechanic, trajectory preview, physics-based destruction
- **Plants vs Zombies** — Lane-based enemy waves, enemy variety with distinct behaviors, resource management
- **Kingdom Rush** — Medieval tower defense, enemy pathing, art style inspiration
- **Castle Crashers** — Cartoony medieval art style, thick outlines, vibrant palette
