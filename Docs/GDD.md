# Drop Dead Keep — Game Design Document

## Overview

| Field | Detail |
|-------|--------|
| **Title** | Drop Dead Keep |
| **Genre** | Physics-Based Tower Defense / Destruction Puzzle |
| **Tagline** | Fling boulders from your castle walls to shatter bridges and send the undead tumbling into the abyss before they rebuild and reach your gates. |
| **Platform** | HTML5 Web Browser (Desktop & Mobile) |
| **Engine** | Vanilla HTML5 Canvas + JavaScript |
| **Physics** | Matter.js (2D rigid-body physics) |
| **Deployment** | Vercel (static + serverless) |
| **Inspiration** | Angry Birds meets Plants vs. Zombies — projectile destruction physics combined with lane-based wave defense |

---

## Core Concept

The player defends a hilltop castle by launching boulders (and other projectiles) from a trebuchet to destroy bridges, walkways, and terrain along a winding mountain path. Waves of zombies march uphill toward the castle gates. When a bridge is destroyed, zombies fall into the chasm below. But the undead are resourceful — some carry planks, ladders, and other materials to rebuild crossings or create makeshift paths over gaps.

The game blends **Angry Birds-style projectile physics and structural destruction** with **Plants vs. Zombies-style wave management and enemy variety**. Each level is a multi-lane mountain approach where zombies wind their way up switchback paths connected by destructible bridges.

---

## Core Game Loop

```
┌─────────────────────────────────────────────────┐
│  1. SCOUT — Survey the approaching zombie wave   │
│  2. AIM   — Angle and power the trebuchet        │
│  3. FIRE  — Launch projectile at a bridge/path   │
│  4. WATCH — Physics resolves: debris falls,       │
│             zombies tumble, structures collapse   │
│  5. ADAPT — Zombies rebuild, reroute, or stack;  │
│             player reloads and re-prioritizes     │
│  6. REPEAT until wave cleared or gates breached  │
└─────────────────────────────────────────────────┘
```

### Win Condition
Survive all waves without zombies reaching the castle gate.

### Lose Condition
A set number of zombies breach the gate (configurable per level, default: 5).

---

## The Mountain Map

Each level takes place on a **side-view mountain** with the castle perched at the top. Zombie hordes spawn at the base and march upward along a winding path of switchbacks connected by bridges.

### Map Structure
```
    🏰 CASTLE (top)
    ═══════════
        │
   ╔═══╧═══════╗
   ║  BRIDGE 5  ║  ← Closest to castle (last defense)
   ╠════════════╣
   ║  PATH      ║  ← Zombies walk left-to-right
   ╠════════════╣
   ║  BRIDGE 4  ║
   ╠════════════╣
   ║  PATH      ║  ← Zombies walk right-to-left (switchback)
   ╠════════════╣
   ║  BRIDGE 3  ║
   ╠════════════╣
   ║  PATH      ║
   ╠════════════╣
   ║  BRIDGE 2  ║
   ╠════════════╣
   ║  PATH      ║
   ╠════════════╣
   ║  BRIDGE 1  ║  ← First crossing from spawn
   ╠════════════╣
   ║  SPAWN     ║  ← Zombie entry point (bottom)
   ╚════════════╝
```

### Bridge Types

| Bridge | Material | HP | Debris Physics | Rebuild Time |
|--------|----------|----|----------------|--------------|
| Rope Bridge | Rope & planks | 30 | Planks swing and scatter | Fast (5s) |
| Wooden Bridge | Timber beams | 60 | Splinters, boards tumble | Medium (10s) |
| Stone Bridge | Carved stone | 100 | Heavy chunks, rubble pile | Slow (20s) |
| Iron Bridge | Metal grating | 80 | Bends, warps, partial collapse | Cannot rebuild |
| Drawbridge | Chain & wood | 50 | Flips down/up, chain snaps | Repairable by engineers |

Each bridge is composed of **physics bodies** — planks, beams, stones, chains — connected by constraints. When hit by a projectile, constraints break and pieces scatter realistically using Matter.js.

---

## The Catapult / Slingshot (Player Weapon)

A catapult sits on the castle battlements. The player uses a **slingshot/drag-back mechanic** (Angry Birds-style) — drag back from the catapult to aim, trajectory preview shows where the shot will land, release to fire. Ammo types are selected from icons along the castle wall.

### Controls

| Action | Keyboard | Mouse/Touch |
|--------|----------|-------------|
| Aim & Power | — | **Drag back from catapult** to set angle + force |
| Fire | Space (confirm) | **Release drag** |
| Quick-select Ammo | 1-4 keys | Tap ammo icons along bottom bar |
| Camera Pan | Arrow keys / WASD | Two-finger drag |
| Zoom | Scroll wheel | Pinch |

### Aiming System (Slingshot Mechanic)
- **Drag-to-Aim**: Click/tap the catapult and drag backward. The drag direction and distance set both the launch angle and power in one gesture
- **Trajectory Preview**: Dotted arc line shows the predicted flight path in real-time as the player drags
- **Release to Fire**: Let go to launch the projectile
- **Wind Indicator**: Arrow showing wind direction and strength (harder difficulties)
- **Reload Timer**: Brief cooldown between shots (varies by ammo type)

### Ammo Types

Ammo is selected from a bottom toolbar showing icons with remaining count. Based on concept art:

| Ammo | Icon | Count | Damage | Special | Unlock |
|------|------|-------|--------|---------|--------|
| **Boulder** | Gray circle | 12+ | High | Standard impact, smashes bridges, knocks zombies off | Default |
| **Fireball** | Orange/red sphere | 5 | Medium | Burns wood bridges faster, area damage over time | Level 3 |
| **Ice Bomb** | Blue sphere | 3 | Low | Freezes zombies in place, frozen bridges become fragile | Level 7 |
| **Mega Bomb** | Gold sphere | 1 | Massive | Huge radius, destroys entire bridge sections | Level 10 |

### Reload & Economy
- Boulders are **plentiful** (12+ per wave) — the bread-and-butter ammo
- Special ammo has a **limited per-wave supply** shown as count under each icon
- Earned by kill streaks, wave completion bonuses, and star ratings
- Reload time: Boulder (1.5s), Fireball (2.5s), Ice Bomb (3s), Mega Bomb (4s)

---

## Zombie Types

Zombies approach in waves with escalating difficulty. Each type has distinct behavior, speed, and interactions with destroyed terrain.

### Basic Zombies

From the Bestiary concept art, each zombie has stats rated on a 6-pip scale for HP, SPD (speed), DMG (damage), and ARM (armor).

| Zombie | HP | SPD | DMG | ARM | Behavior |
|--------|-----|-----|-----|-----|----------|
| **Shambler** | 1/6 | 1/6 | 1/6 | 0/6 | Basic zombie. Slow, fragile, travels in packs. Falls easily off broken bridges. The bread and butter of every wave. |
| **Sprinter** | 1/6 | 5/6 | 1/6 | 0/6 | Fast runner, can jump small gaps (< 2 tiles). Fragile but hard to time shots against. |
| **Brute** | 5/6 | 1/6 | 4/6 | 3/6 | Heavy tank, can bash through weakened structures. Slow but very hard to kill. |
| **Screecher** | 2/6 | 3/6 | 2/6 | 0/6 | Screams to buff nearby zombies' speed. Purple-tinted, ethereal appearance. |
| **Engineer** | 2/6 | 2/6 | 1/6 | 1/6 | The core mechanic — rebuilds destroyed bridges if left alive. Carries tools and hard hat. Prioritize killing! |

### Builder Zombies (The Core Twist)

Builder zombies are the **key mechanic** that distinguishes Drop Dead Keep. They carry materials and can rebuild destroyed crossings.

| Builder Type | Carries | Behavior | Counter |
|-------------|---------|----------|---------|
| **Plank Carrier** | Wooden planks (2-3) | Drops planks across small gaps to create a walkway. Other zombies can cross the plank. | Destroy planks with fire; planks are fragile (1 hit) |
| **Ladder Zombie** | Tall ladder | Props ladder against cliff faces to create alternate vertical routes, bypassing bridges entirely. | Knock ladder over with boulder impact nearby |
| **Rope Thrower** | Grapple & rope | Throws rope across wide gaps. Creates a slow single-file crossing. | Cut rope by hitting the anchor point |
| **Engineer** | Tools & materials | Slowly repairs destroyed bridges back to partial functionality. Must stand still while repairing. | Easy to hit while stationary — prioritize! |
| **Raft Builder** | Logs & bindings | At water crossings, builds a raft to float across instead of using the bridge. | Sink raft with a direct hit |

### Elite Zombies (Late Game)

| Elite | HP | Special |
|-------|----|---------|
| **Shield Bearer** | 40 | Carries a door/shield that blocks one frontal projectile hit before breaking |
| **Necromancer** | 30 | Resurrects fallen zombies within a radius; kill quickly or cleared areas refill |
| **Siege Tower** | 150 | Mobile wooden tower pushed by multiple zombies; acts as portable bridge over any gap |
| **Giant** | 200 | Enormous; can wade through shallow chasms; shakes screen on footsteps |

---

## Dual-Phase Gameplay

The game features **two distinct gameplay phases** that alternate during each level:

### Phase 1: Slingshot (Bridge Breaker)
The primary gameplay mode. Side-view of the mountain approach. Player launches projectiles from the catapult to destroy bridges and kill zombies on the path. This is the strategic, physics-based phase.

### Phase 2: Gate Defense
When zombies reach the castle wall, the perspective **shifts to top-down** looking down from the battlements. The player sees the castle gate (with an iron portcullis) and the horde massing below. The player deploys defensive items by tapping/clicking below the wall:

| Defense | Icon | Count | Effect |
|---------|------|-------|--------|
| **Oil** | Blue barrel | x5 | Poured from the wall, slows zombies in area |
| **Rocks** | Gray stones | x6 | Dropped directly onto zombies below |
| **Fire** | Flame icon | x3 | Sets oil slicks ablaze, area denial |

- **Gate Health Bar**: Shows gate integrity as a percentage (e.g., "GATE 28%")
- **Hold Timer**: Countdown showing how long the player must survive this phase (e.g., "HOLD 0:34")
- **Win**: Survive the timer — remaining zombies retreat, return to Slingshot phase for next wave
- **Lose**: Gate health reaches 0%

This creates a **rhythm**: strategic bridge destruction to thin the horde, then frantic gate defense when survivors reach the wall.

---

## Enemy Bestiary

The Bestiary is an in-game encyclopedia that players unlock as they encounter each zombie type. Accessible from the main menu, it displays:

- **Thumbnail gallery** on the left — click to select a zombie type
- **Detail panel** on the right — large sprite, description, and stat bars
- **Stat bars** use a 6-pip rating system: HP, SPD (speed), DMG (damage), ARM (armor)
- **Rarity tier** label above the name (Common, Uncommon, Rare, Elite)
- Entries are **locked/silhouetted** until the player encounters that type in gameplay

---

## Physics & Destruction System

The destruction system is the **heart of the game**. Bridges and structures are built from physics-enabled bodies connected by breakable constraints.

### Matter.js Integration
- Each bridge plank, beam, chain link, and stone block is a **rigid body** with mass, friction, and restitution
- Connections use **constraints** with a `stiffness` and `breakForce` threshold
- When projectile impact force exceeds a constraint's `breakForce`, the connection snaps
- Debris becomes part of the physics world — blocks tumble, planks swing, chains whip
- Zombies standing on a collapsing bridge **ragdoll** and fall

### Destruction Detail

```
BEFORE HIT:                    AFTER HIT:
┌──────────────┐              ┌───┐    ┌───┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│              │▓▓▓│    │▓▓▓│
│══════════════│              │═══╡  ╞═│═══│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│              │▓▓▓│ ╲  │▓▓▓│
└──────────────┘              └───┘  ╲ └───┘
  Intact bridge                       ╲
                                    ▓ ╲ ▓
                                   ══  ═══
                                  Debris falls
```

### Terrain Interaction
- **Rubble Accumulation**: Debris piles up at the bottom of chasms. If enough debris accumulates, zombies can **walk across the rubble pile** — rewarding players who aim for the edges, not the center
- **Chain Reactions**: A falling stone block can hit another bridge below, causing cascading destruction
- **Water**: Some chasms have water — debris sinks, zombies drown (except raft builders)
- **Oil Slicks**: Pre-placed on some bridges — ignitable with fire barrel for area denial

---

## Wave System

### Wave Structure
Each level consists of 3–8 waves with increasing difficulty.

```
WAVE ANNOUNCEMENT
  ↓
ZOMBIE SPAWN (staggered over 10-30 seconds)
  ↓
ACTIVE COMBAT (player fires, zombies march, builders build)
  ↓
WAVE CLEAR (all zombies dead or past gate)
  ↓
INTERMISSION (5-10 seconds)
  → Bridges partially regenerate (rope bridges only)
  → Player receives bonus ammo
  → Score tally for wave
  ↓
NEXT WAVE
```

### Wave Composition Example (Level 1)

| Wave | Zombies | Composition |
|------|---------|-------------|
| 1 | 8 | 8 Shamblers — learn the basics |
| 2 | 12 | 10 Shamblers + 2 Runners — speed pressure |
| 3 | 15 | 8 Shamblers + 4 Runners + 3 Plank Carriers — **builders introduced** |
| 4 | 20 | 10 Shamblers + 4 Runners + 4 Plank Carriers + 2 Engineers |
| 5 (Final) | 25 | Mixed horde + 1 Brute + 2 Engineers + Shield Bearer |

### Difficulty Scaling
- **More Zombies** per wave
- **Faster spawn rates**
- **More builder types** introduced
- **Stronger bridges** that require multiple hits
- **Wind** added on harder difficulties
- **Multiple approach paths** branch on later levels

---

## Level Progression

### World 1: The Foothills (Levels 1-5)
- **Theme**: Grassy cliffs, wooden bridges, clear skies
- **Bridges**: Rope and wooden only
- **Enemies**: Shamblers, Runners, Plank Carriers
- **Ammo**: Boulders only (Fire Barrel unlocked at Level 3)
- **Teaching**: Core loop — aim, fire, destroy, survive

### World 2: The Gorge (Levels 6-10)
- **Theme**: Deep canyon, rushing river below, stone bridges
- **Bridges**: Stone and iron added
- **Enemies**: + Brutes, Engineers, Ladder Zombies
- **Ammo**: + Chain Shot (Level 5), Ice Bomb (Level 7)
- **Mechanic Intro**: Water crossings, raft builders, rubble accumulation matters

### World 3: The Dark Approach (Levels 11-15)
- **Theme**: Night, fog, volcanic rock, lava chasms
- **Bridges**: Mix of all types, some pre-damaged
- **Enemies**: + Rope Throwers, Shield Bearers, Necromancers
- **Ammo**: + Tar Pot (Level 9 — available here)
- **Mechanic Intro**: Limited visibility (fog of war), oil slick / fire combos

### World 4: The Keep (Levels 16-20)
- **Theme**: Castle outer walls, drawbridges, the final stand
- **Bridges**: Drawbridges, massive stone structures
- **Enemies**: All types + Siege Towers, Giants
- **Mechanic Intro**: Multiple simultaneous approach paths, boss waves
- **Final Level**: Endless horde mode — survive as long as possible for high score

---

## Scoring System

| Action | Points |
|--------|--------|
| Zombie killed by falling | 100 |
| Zombie killed by direct projectile hit | 50 |
| Zombie killed by debris | 150 (physics bonus) |
| Zombie drowned | 75 |
| Bridge destroyed (full) | 200 |
| Chain reaction (2+ bridges) | 500 |
| Multi-kill (3+ zombies, one shot) | 300 |
| Builder killed while building | 200 |
| Wave cleared, no gate breaches | 500 |
| Level cleared, no gate breaches | 1000 |
| Ammo efficiency bonus (< 50% ammo used) | 250 |

### Star Rating (per level)
- ⭐ Complete the level (survive all waves)
- ⭐⭐ Complete with ≤ 2 gate breaches
- ⭐⭐⭐ Complete with 0 gate breaches and score above threshold

---

## Art Direction

### Visual Style
**Cartoony 2D with thick outlines and vibrant colors** against a dark, moody night-sky backdrop. The contrast between cute/rounded zombie designs and the grim castle setting creates the game's distinctive tone.

Based on the concept art:

- **Color Palette**:
  - **Background**: Deep navy/purple night sky with stars, crescent moon
  - **Terrain**: Dark brown earth, muted green vegetation (small trees/bushes as landmarks)
  - **Castle**: Warm tan/beige stone, gray battlements with orange wall torches
  - **UI Accent**: Bright orange for selected states, headers, and interactive elements
  - **Zombies**: Bright green with dark outlines, large round eyes, friendly-menacing design
  - **Text**: Off-white for body, yellow/gold for headers, red for warnings (gate health)
- **Castle Battlements**: Crenellated wall with evenly spaced torches, murder holes (for oil/rocks in Gate Defense)
- **Bridges**: Show **3 destruction states** — Intact (full planks), Damaged (missing planks, tilted), Destroyed (broken ends, gap). Wooden construction with visible planks and support beams
- **Zombies**: Round, cute-grotesque design. Green bodies, large dot eyes, stubby limbs. Engineers wear hard hats. Screechers are purple/ethereal. Sprinters lean forward. Each type visually distinct at a glance
- **Terrain Elements**: Cliff paths (brown with grass tufts), dead trees (bare branches), wall torches (orange glow), battlement blocks
- **Night Setting**: Stars twinkle, moon provides ambient light, torches cast warm pools of light on the castle wall

### Engineer Rebuild Sequence
A 4-step animated sequence shown in the World Art concept:
1. **Arrives** — Engineer walks to the gap
2. **Places Plank** — Lays first board across the gap
3. **Hammers** — Animated hammering with progress bar
4. **Complete** — Bridge restored, engineer moves on

### Bridge Destruction States
Each bridge renders in one of three visual states:
- **Intact**: Full plank construction, supports visible
- **Damaged**: Missing planks, crooked supports, cracking
- **Destroyed**: Broken stubs on each cliff edge, gap open

### Canvas Rendering Approach
All rendering done via HTML5 Canvas 2D context:
- Sprites for characters and bridge components — thick outlines, flat color fills
- Procedural particle systems for destruction effects (dust, splinters, sparks)
- Screen shake on heavy impacts
- Warm torch glow effects on castle walls
- Slow-motion replay on spectacular multi-kills (optional toggle)

### UI Style
- **Dark theme** with orange accents (matching concept art)
- **Tab navigation**: Slingshot | Gate Defense | Bestiary | World Art — orange highlight on active tab
- **Ammo bar**: Bottom of screen, icons with remaining count below each
- **HUD**: Minimal — instruction text at bottom ("DRAG FROM CATAPULT TO AIM : RELEASE TO FIRE")
- **Gate Defense HUD**: Gate health bar (red), hold timer, defense item selector
- **Font**: Monospace/pixel style, uppercase, generous letter-spacing for a medieval-tech feel

---

## Audio Design

All audio generated programmatically via **Web Audio API** (no external audio files needed for MVP).

| Event | Sound |
|-------|-------|
| Trebuchet fire | Deep thwack + whoosh |
| Boulder impact (stone) | Heavy crunch + rumble |
| Boulder impact (wood) | Crack + splinter |
| Bridge collapse | Creaking + crashing cascade |
| Zombie fall scream | Descending comedic wail |
| Zombie splat (landing) | Wet impact |
| Zombie groan (ambient) | Low periodic moan |
| Fire ignite | Whoompf + crackle |
| Ice freeze | Crystalline shatter |
| Wave start horn | Medieval trumpet blast |
| Wave clear fanfare | Ascending triumphant notes |
| Gate breach alarm | Urgent bell toll |
| Multi-kill | Ascending chime combo |
| UI click | Stone click |
| Star earned | Bright ding |

### Music (Post-MVP)
Procedural ambient medieval soundtrack — lute arpeggios, low drums, tension strings that intensify with wave progress.

---

## Technical Architecture

### Stack
- **Frontend**: HTML5 Canvas, vanilla JavaScript (ES modules)
- **Physics**: Matter.js for rigid-body simulation
- **Backend**: Vercel serverless functions (Node.js)
- **Storage**: Vercel KV (leaderboard persistence)
- **Deployment**: Vercel auto-deploy on push to main

### Project Structure
```
/drop-dead-keep
  index.html                  # Entry point
  styles.css                  # UI styling
  vercel.json                 # Deployment config
  package.json                # Dependencies & scripts
  /Docs
    GDD.md                    # This document
  /src
    main.js                   # Boot, scene management
    game.js                   # Core game loop, state machine
    /physics
      world.js                # Matter.js world setup
      bridge.js               # Bridge construction & destruction
      projectile.js           # Boulder & ammo physics
      debris.js               # Debris & rubble management
      ragdoll.js              # Zombie ragdoll on fall
    /entities
      trebuchet.js            # Player weapon, aim & fire
      zombie.js               # Base zombie class
      zombie-types.js         # Shambler, Runner, Brute, etc.
      builders.js             # Plank Carrier, Engineer, etc.
      elites.js               # Shield Bearer, Necromancer, etc.
    /world
      level.js                # Level data loader
      map.js                  # Mountain path & bridge layout
      terrain.js              # Cliffs, water, chasms
      camera.js               # Pan, zoom, follow projectile
    /systems
      wave.js                 # Wave spawning & management
      scoring.js              # Points, combos, star rating
      ammo.js                 # Ammo inventory & selection
      particles.js            # Dust, splinters, sparks
    /ui
      hud.js                  # In-game HUD overlay
      menus.js                # Title, pause, game-over, level-select
      controls.js             # Input handling (keyboard, mouse, touch)
    /audio
      audio.js                # Web Audio API sound engine
      sounds.js               # Sound definitions & triggers
    /rendering
      renderer.js             # Main canvas draw loop
      sprites.js              # Sprite loading & drawing
      backgrounds.js          # Parallax backgrounds
      effects.js              # Screen shake, slow-mo, overlays
    /data
      levels.json             # Level definitions (bridge layout, waves, etc.)
  /api
    leaderboard.js            # GET/POST leaderboard entries
  /public
    /sprites                  # Sprite sheets (if any)
    /levels                   # Level data (alternative to JSON)
```

### Deployment Configuration

**vercel.json**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

**package.json**
```json
{
  "name": "drop-dead-keep",
  "version": "1.0.0",
  "description": "Fling boulders to shatter bridges and send the undead tumbling into the abyss",
  "private": true,
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "@vercel/kv": "^1.0.1",
    "matter-js": "^0.20.0"
  }
}
```

### Local Development
```bash
npm install
vercel dev        # Runs on localhost:3000
```

### Environment Variables (Production)
- `KV_REST_API_URL` — Vercel KV Redis connection
- `KV_REST_API_TOKEN` — Vercel KV auth token

---

## Leaderboard

### Data Per Entry
- Player name / initials (3-10 chars)
- Score
- Level completed
- Stars earned
- Zombies killed
- Favorite ammo used
- Timestamp

### API Routes

**GET /api/leaderboard**
`?level=all&limit=50&timeframe=weekly`
Returns top entries sorted by score.

**POST /api/leaderboard**
```json
{
  "name": "AAA",
  "score": 15200,
  "level": 5,
  "stars": 3,
  "kills": 47,
  "ammo": "fire_barrel"
}
```

### Anti-Abuse
- Rate limiting (10 submissions/hour per IP)
- Score validation (server-side sanity checks)
- Duplicate detection

---

## Game Balance Targets

### Player Power Budget
- Boulder reload: 1.5 seconds
- Average bridge destruction: 2-3 boulders for wood, 4-5 for stone
- Trebuchet range: Full map coverage with power adjustments
- Special ammo per wave: 2-4 shots depending on type

### Zombie Balance
- Time from spawn to gate (unimpeded): ~45 seconds for Shambler, ~25 seconds for Runner
- Builder repair time: Should give player 2-3 shots to interrupt
- Wave duration: 60-120 seconds of active combat
- Ideal session length per level: 3-5 minutes

### Difficulty Curve
- Levels 1-2: Tutorial — single path, basic zombies, forgiving
- Levels 3-5: Introduction of builders — the "aha" moment
- Levels 6-10: Multiple bridge types, strategic ammo choice matters
- Levels 11-15: Fog, fire combos, elite zombies — demanding
- Levels 16-20: All mechanics combined, boss encounters, mastery required

---

## Tutorial & Pacing Design

Inspired by George Fan's GDC 2012 talk ["How I Got My Mom to Play Through Plants vs. Zombies"](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan), we follow these core principles:

### Design Principles

1. **Tutorial Chameleon** — The tutorial IS the game. No tutorial screens, no walls of text. Players learn by doing, never by reading
2. **Do Over Read** — The first level teaches that you drag the catapult, projectiles fly in arcs, and bridges break. Zero text needed — the player sees the result of their action and understands
3. **Spread Mechanics Over Time** — Introduce ONE new thing per level. Let players "play with their toys" before giving them new ones. Each small addition = a dopamine hit
4. **Safe Introduction** — New zombie types first appear in an easy, manageable wave. The NEXT level uses that same zombie in a harder combination
5. **Adaptive Messaging** — Show hint arrows/text only if the player seems stuck (e.g., hasn't fired after 10 seconds). Experienced players never see tutorial prompts
6. **Eloquent Caveman** — Any text that does appear is terse, direct: "DRAG TO AIM" not "Click and drag backward on the catapult to set your launch angle and power"
7. **Visuals Teach** — Each zombie type is visually distinct so players can identify threats at a glance. Engineers wear hard hats. Brutes are huge. Sprinters lean forward

### Level 1-1: The Tutorial (Step-by-Step)

Modeled directly on PvZ Level 1's approach: single lane, one tool, short terse prompts that guide without interrupting. The game world is simplified — only ONE bridge, ONE path, a handful of slow zombies. The entire playfield is stripped down so nothing distracts from the core mechanic being taught.

**Map Setup**: Minimal mountain with just one bridge and one path. Only boulders available. Only Shamblers (slowest, weakest zombie). The map is deliberately stripped down — like PvZ's single lane + single plant type in Level 1.

**Phase 1: Pre-Zombie (Learn the Weapon)**

Before any zombies appear, the player learns the catapult in a zero-pressure environment.

```
Step 1: "Tap on a boulder to pick it up!"
────────────────────────────────────────────
- Boulder ammo icon PULSES with orange glow at bottom of screen
- Arrow points to it
- Nothing else happens until player taps/clicks the boulder icon
- On tap: boulder icon highlights, cursor changes to show boulder selected
- Prompt disappears immediately

Step 2: "Drag back from the catapult to aim!"
────────────────────────────────────────────
- Catapult on castle wall PULSES with orange glow
- Arrow points to it
- Player drags backward — trajectory preview arc appears in real-time
- Text disappears as soon as player starts dragging
- If player releases too early (weak shot), gentle prompt:
  "Pull back further for more power!"

Step 3: (no text — player releases, boulder flies)
────────────────────────────────────────────
- Boulder arcs through the air — camera FOLLOWS the projectile
- Impact on bridge — SATISFYING destruction: planks splinter, dust puffs
- Bridge collapses with physics debris
- Brief slow-motion on first-ever bridge destruction (0.5s)
- This is the "aha!" moment — pure visual reward, zero text

Step 4: "Nicely done! The bridge is destroyed!"
────────────────────────────────────────────
- Positive reinforcement (like PvZ's "Nicely done!")
- Text appears briefly (2 seconds), then fades
- Score pops up: "+200 BRIDGE DESTROYED"

Step 5: "Tap on a boulder to fire again!"
────────────────────────────────────────────
- Reinforcement through REPETITION (PvZ: "Tap on the peashooter
  to plant another one!")
- Player fires a second boulder at remaining bridge debris
- No prompt after this — player now owns the mechanic
```

**Phase 2: Zombies Appear (Learn the Stakes)**

Now zombies enter. The bridge is already destroyed, so the player immediately sees the payoff.

```
Step 6: "Don't let the zombies reach your gate!"
────────────────────────────────────────────
- THE stakes prompt (PvZ: "Don't let the zombies reach your house!")
- Zombie health/progress bar appears in top-right corner of HUD
- 3 Shamblers spawn at bottom, march slowly upward
- They reach the gap where bridge was — and FALL IN
- Comedic falling scream, splat sound
- "+100 +100 +100" score popups
- Player learns: destroy bridge → zombies fall. Core loop understood.
- NO MORE PROMPTS after this — player is on their own

Step 7: (Second small wave — no prompts, player applies knowledge)
────────────────────────────────────────────
- 3 more Shamblers on same path via a SECOND bridge (still intact)
- Player must fire boulders to destroy this bridge before zombies cross
- This is the real test — can they aim, fire, and destroy in time?
- Bridge has a generous health (destroyed in 1-2 hits)
- Zombies walk slowly, giving player plenty of time
- If zombies DO cross, they continue up path — player sees gate
  health decrease but level is forgiving (high gate HP)
```

**Phase 3: Final Wave (Escalation Within Tutorial)**

```
Step 8: "FINAL WAVE" banner
────────────────────────────────────────────
- Big dramatic text slides across screen (PvZ-style)
- 5 Shamblers spawn — the most so far
- Some stagger, arriving in 2-3 small groups
- Player fires multiple boulders to deal with them
- Bridges may already be destroyed from earlier — free kills
- If any bridges rebuilt (they don't in 1-1), player needs to
  re-destroy them

Step 9: Wave Complete — Level Clear
────────────────────────────────────────────
- Fanfare sound
- "LEVEL COMPLETE" banner
- Star rating appears (guaranteed 3 stars on tutorial)
- Score summary + zombie kill count
- Button: "NEXT LEVEL →"
```

### Tutorial Flow Parallels

| PvZ Level 1 | Drop Dead Keep Level 1-1 |
|---|---|
| "Tap on a seed packet to pick it up!" | "Tap on a boulder to pick it up!" |
| "Tap on the grass to plant your seed!" | "Drag back from the catapult to aim!" |
| "Nicely done!" | "Nicely done! The bridge is destroyed!" |
| "Tap on the peashooter to plant another one!" | "Tap on a boulder to fire again!" |
| "Tap on the falling sun to collect it!" | (Score popups teach points organically) |
| "Keep on collecting sun!" | (No equivalent — ammo is simpler than sun economy) |
| "Don't let the zombies reach your house!" | "Don't let the zombies reach your gate!" |
| Zombie health bar appears top-right | Zombie progress bar appears top-right |
| "FINAL WAVE" banner | "FINAL WAVE" banner |
| Peashooters fire automatically — player observes | Destroyed bridges kill automatically — player observes |

### Key Tutorial UX Rules

Derived from PvZ's approach and George Fan's GDC principles:

- **One prompt at a time** — never stack multiple instructions
- **Prompts are reactive** — appear only when the player needs to do something, disappear the instant they start doing it
- **Reinforcement through repetition** — make the player do the core action twice before introducing zombies (PvZ makes you plant two peashooters before any zombie appears)
- **State the stakes plainly** — "Don't let the zombies reach your gate!" is clear, urgent, and memorable
- **Positive reinforcement** — "Nicely done!" after first successful action
- **Let results speak** — the bridge exploding and zombies falling teaches more than any text ever could. Like PvZ's peashooters auto-firing, our destroyed bridges auto-kill — the player watches their work pay off
- **"FINAL WAVE" drama** — telegraphs the end, creates excitement, makes completion feel earned
- **Escalation within the level** — 0 zombies → 3 zombies → 3 zombies → 5 zombies (FINAL WAVE). PvZ does the same: 0 → 1 → more → FINAL WAVE
- **If player already knows**: Adaptive check — if player fires without prompts, skip all tutorial text. "Just get the player to do it once"
- **Fail-safe**: If player does nothing for 15 seconds, re-show the current prompt with a subtle pulse
- **The lawnmower equivalent**: PvZ has lawnmowers as a last-resort safety net. Our equivalent: the gate has generous HP in early levels (can absorb 10+ zombie hits), so even if some get through, the player doesn't lose on Level 1
- **Failure coaching** — When the player makes a mistake, don't just let them fail silently. Show a reactive hint explaining what went wrong and suggesting a fix. PvZ: "One of your peashooters died! Try planting them further to the left!" This teaches positioning strategy through failure, not upfront lectures
- **Tease the next unlock** — At the end of each level, the next level's reward icon briefly appears on-screen (PvZ shows the Wall-nut icon with an arrow at bottom-right of Level 3). Builds anticipation and motivation to continue

### Failure Coaching Messages

Reactive hints that appear ONLY when the player makes a specific mistake. Never shown proactively — only triggered by the failure event itself.

| Trigger | Message | What It Teaches |
|---------|---------|-----------------|
| Bridge rebuilt by Engineer | "An Engineer rebuilt that bridge! Take them out before they reach the gap!" | Prioritize killing Engineers |
| Zombie crosses intact bridge | "Destroy the bridge before they cross!" | Timing / urgency |
| Boulder misses (hits nothing) | "Aim for the bridge, not the path!" | Targeting accuracy |
| 3+ zombies breach gate in one wave | "Too many got through! Focus on the closest bridge to the gate!" | Priority management |
| Player hasn't fired in 20 seconds | "Don't forget to fire! Tap a boulder to get started." | Re-engagement |
| Fireball used on stone bridge | "Fireballs work best on wooden bridges!" | Ammo-bridge matchups |
| Zombies walk across rubble pile | "Debris piled up in the chasm! Aim for the edges next time." | Rubble accumulation awareness |

**Rules for failure coaching:**
- Show ONCE per failure type per level — never nag
- Disappears after 3 seconds or on player's next action
- Never shown on replayed levels (player already knows)
- Tone is helpful, never punishing — "Try X!" not "You failed because..."

### Level 1-2: Second Level (Scaled Up + New Mechanic)

Level 2 follows PvZ's exact pattern: bigger map, new tool introduced with guided prompts, then player is on their own. In PvZ, Level 2 jumps from 1 lane to 3 and introduces sunflowers. Our Level 1-2 jumps from 1 bridge to 2 bridges.

**Map Setup**: Mountain with TWO bridges on the path (not just one). Still only Shamblers. Still only boulders. The increase is in spatial complexity, not enemy variety.

**Phase 1: New Mechanic Highlighted**

```
Step 1: "You now have two bridges to defend!"
────────────────────────────────────────────
- Camera pans across the mountain path, pausing briefly on each bridge
- Both bridges PULSE with orange outline to draw attention
- Text appears at bottom — terse, informative
- (PvZ equivalent: "Sunflowers are an extremely important plant!")

Step 2: "Try to destroy the lower bridge first!"
────────────────────────────────────────────
- Arrow points to Bridge 1 (the lower one, closer to zombie spawn)
- Gives player a CONCRETE GOAL — not vague advice, a specific target
- (PvZ equivalent: "Try to plant at least 3 of them!")
- Player fires boulder at Bridge 1 — destruction plays out

Step 3: "The more bridges you break, the fewer zombies reach your gate!"
────────────────────────────────────────────
- Connects the new complexity to the core mechanic they already know
- (PvZ equivalent: "The more sunflowers you have, the faster you
  can grow plants!")
- Text fades after 2 seconds — player now understands the WHY
```

**Phase 2: Player On Their Own**

```
Step 4: (Zombies spawn — no more prompts)
────────────────────────────────────────────
- 4 Shamblers march up from spawn
- If Bridge 1 is destroyed, they fall at the first gap — free kills
- If Bridge 2 is still intact, surviving zombies continue up
- Player must now manage their reload time between two targets

Step 5: (Second wave — more zombies, faster spacing)
────────────────────────────────────────────
- 6 Shamblers in two groups
- Player learns to prioritize: which bridge matters more RIGHT NOW?
- Strategic thinking emerges naturally — no prompts needed
```

**Phase 3: Escalation**

```
Step 6: "A HUGE WAVE OF ZOMBIES IS APPROACHING!"
────────────────────────────────────────────
- Dramatic red text slides across screen (PvZ-style)
- 8 Shamblers in a dense cluster
- Both bridges should be destroyed by now for an easy clear
- If not, player experiences pressure — motivates better play next time

Step 7: Level Complete + Unlock
────────────────────────────────────────────
- Fanfare, star rating, score summary
- Unlock card: "YOU DISCOVERED A NEW ZOMBIE! Sprinter — Fast but
  fragile. Can leap small gaps."
- Sets up anticipation for Level 1-3
```

**Design notes for Level 1-2:**
- **Scale, not complexity** — same tools, same enemy, just MORE of the map to manage
- **Concrete guidance** — "Try to destroy the lower bridge first!" gives a specific number/target, not vague advice
- **Explain the WHY** — connect new complexity to existing knowledge
- **Then silence** — after 3 prompts, no more hand-holding. Player applies what they learned
- **"A HUGE WAVE" banner** — distinct from Level 1's "FINAL WAVE". PvZ uses both at different moments for escalating drama

### Unlock Reward Screen

After completing each level, if the next level introduces a new ammo type or mechanic, an **unlock reward card** appears (modeled on PvZ's "YOU GOT A NEW PLANT!" screen):

```
┌──────────────────────────────────────────────┐
│         YOU UNLOCKED A NEW WEAPON!           │
│                                              │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │             │  │                     │   │
│  │  [FIREBALL  │  │  Burns wood bridges │   │
│  │   ICON]     │  │  faster. Area       │   │
│  │             │  │  damage over time.  │   │
│  └─────────────┘  └─────────────────────┘   │
│                                              │
│              [ CONTINUE ]                    │
└──────────────────────────────────────────────┘
```

**Unlock reward rules:**
- **One unlock per level** — never overwhelm with multiple new things
- **Icon + one-line description** — PvZ's "Gives you additional sun" is the gold standard. Ours: "Burns wood bridges faster. Area damage over time."
- **Tease before reveal** — at the END of the previous level, the new item briefly appears on-screen (e.g., a fireball icon falls from the sky during the victory fanfare), building anticipation before the unlock card
- **New item is highlighted** at the start of the next level — "Fireballs are extremely powerful against wooden bridges!" (one prompt, then the player is on their own)

**Unlock progression:**

| After Level | Unlock | Card Text |
|---|---|---|
| 1-1 | (nothing — first level) | — |
| 1-2 | Sprinter zombie (Bestiary entry) | "YOU DISCOVERED A NEW ZOMBIE! Sprinter — Fast but fragile. Can leap small gaps." |
| 1-3 | Engineer zombie (Bestiary entry) | "YOU DISCOVERED A NEW ZOMBIE! Engineer — Rebuilds destroyed bridges. Take them out first!" |
| 1-4 | Gate Defense mode | "NEW DEFENSE MODE! When zombies reach the wall, drop oil, rocks, and fire from the battlements!" |
| 1-5 | Fireball ammo | "YOU UNLOCKED A NEW WEAPON! Fireball — Burns wood bridges faster. Area damage over time." |
| 2-2 | Brute zombie | "YOU DISCOVERED A NEW ZOMBIE! Brute — Tough and heavy. Can bash through damaged bridges." |
| 2-3 | Plank Carrier zombie | "YOU DISCOVERED A NEW ZOMBIE! Plank Carrier — Drops planks across gaps. Destroy planks with fire!" |
| 2-5 | Ice Bomb ammo | "YOU UNLOCKED A NEW WEAPON! Ice Bomb — Freezes zombies in place. Frozen bridges shatter easily." |
| 3-2 | Screecher zombie | "YOU DISCOVERED A NEW ZOMBIE! Screecher — Screams to speed up nearby zombies." |
| 3-4 | Mega Bomb ammo | "YOU UNLOCKED A NEW WEAPON! Mega Bomb — Massive blast radius. Destroys entire bridge sections." |

### Level Select Screen

The level select screen is the player's home base between levels. Modeled on PvZ's adventure map with world gravestones:

```
┌──────────────────────────────────────────────────────────┐
│                    DROP DEAD KEEP                        │
│                                                          │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │
│  │ 1-1 │  │ 1-2 │  │ 1-3 │  │ 1-4 │  │ 1-5 │          │
│  │ ★★★ │  │ ★★☆ │  │     │  │ 🔒  │  │ 🔒  │          │
│  │[art]│  │[art]│  │PLAY │  │[sil]│  │[sil]│          │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘          │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │FOOTHILLS│ │ GORGE   │ │  DARK   │ │THE KEEP │       │
│  │ (Day)   │ │ (Dusk)  │ │ (Night) │ │ (Dawn)  │       │
│  │ ★★★★☆  │ │  🔒     │ │  🔒     │ │  🔒     │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                          │
│  [ BESTIARY ]  [ LEADERBOARD ]  [ SETTINGS ]            │
└──────────────────────────────────────────────────────────┘
```

**Level select features:**
- **Completed levels** show preview art (thumbnail of the mountain map) + star rating (1-3 stars)
- **Current level** is enlarged with a "PLAY" button (PvZ highlights the next level)
- **Locked levels** are silhouetted with a padlock icon — creates curiosity about what's coming
- **World banners** at bottom show themed sections (Foothills/Gorge/Dark/Keep) — locked worlds are grayed out with padlock
- **World star total** shown under each banner (e.g., "★★★★☆" = 4 of 5 possible stars earned)
- **Unlock indicator** on completed levels shows what was earned (ammo icon or zombie portrait with checkmark)

### Pre-Level Zombie Preview

Before each level starts, a brief **zombie preview** shows the horde massing at the base of the mountain (like PvZ showing zombies gathering on the sidewalk):

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    The mountain path, zoomed out...                  │
│                                                      │
│    Zombies shuffling into formation at the bottom    │
│    New zombie types HIGHLIGHTED with a glow          │
│    Camera slowly pans up to reveal the full path     │
│                                                      │
│              "A huge wave of zombies                 │
│               is approaching!"                       │
│                                                      │
│              [ BEGIN LEVEL ]                          │
└──────────────────────────────────────────────────────┘
```

This serves two purposes:
1. **Tension builder** — player sees the scale of what's coming
2. **Reconnaissance** — player can spot new zombie types and plan accordingly

### Level-by-Level Mechanic Introduction

Each level introduces **exactly one new concept**. The player masters it before the next is added.

| Level | New Mechanic | Unlock Reward | What Player Learns | Zombie Roster |
|-------|-------------|---------------|-------------------|---------------|
| **1-1** | Catapult + Boulder | — | Drag-to-aim, trajectory preview, release to fire. Destroy a single rope bridge. | 5 Shamblers (single file) |
| **1-2** | Multiple bridges | Sprinter (Bestiary) | Must prioritize which bridge to destroy first. | 8 Shamblers (two bridges) |
| **1-3** | Sprinters | Engineer (Bestiary) | Fast enemies that can jump small gaps — bridges must be fully destroyed, not just damaged | 6 Shamblers + 3 Sprinters |
| **1-4** | **Engineers** | Gate Defense mode | THE core mechanic reveal. Engineers rebuild bridges — player must learn to prioritize killing them | 8 Shamblers + 2 Engineers |
| **1-5** | Gate Defense phase | Fireball ammo | First time zombies reach the wall. Player learns oil/rocks/fire defense | 12 mixed + 3 Engineers (some will breach) |
| **2-1** | Fireball ammo | — | Wood bridges can be burned. Fire creates area denial. "Fireballs are extremely powerful against wooden bridges!" | 10 Shamblers + 4 Sprinters |
| **2-2** | Wooden bridges | Brute (Bestiary) | Stronger bridges that take 2-3 hits. Fireball is more effective | 12 mixed |
| **2-3** | Brutes | Plank Carrier (Bestiary) | Heavy zombies that can bash weakened structures — must fully destroy, not just damage | 8 mixed + 2 Brutes |
| **2-4** | Plank Carriers | — | Zombies that drop planks across gaps. Must destroy planks or kill carriers before they reach gap | 10 mixed + 4 Plank Carriers |
| **2-5** | Multi-path level | Ice Bomb ammo | Two approach routes — must split attention between paths | 15 mixed, split across 2 paths |
| **3-1** | Ice Bomb ammo | — | Freeze zombies in place, frozen bridges become fragile. "Ice makes bridges shatter in one hit!" | 12 mixed |
| **3-2** | Stone bridges | Screecher (Bestiary) | Very tough bridges, require multiple boulders or Mega Bomb | 15 mixed |
| **3-3** | Screechers | — | Speed-buffing zombie. Must be killed quickly or entire wave accelerates | 12 mixed + 2 Screechers |
| **3-4** | Ladder Zombies | Mega Bomb ammo | Bypass bridges entirely — create alternate routes up cliff faces | 15 mixed + 3 Ladder Zombies |
| **3-5** | Mega Bomb ammo | (World 3 complete) | One massive shot — save it for the right moment. Boss-like final wave | 20 mixed horde |

### Pacing Rhythm

Following PvZ's pattern of **introduce → practice → combine → escalate**:

```
Level N:   UNLOCK new thing at end of previous level
           ↓
Level N:   START with highlight prompt ("Fireballs are extremely powerful!")
           ↓
Level N:   Use new thing in SAFE context (easy wave, few zombies)
           ↓
Level N+1: Use same thing in HARDER context (more zombies, combined with previous threats)
           ↓
Level N+1: UNLOCK next new thing at end
           ↓
Level N+2: Introduce NEXT mechanic (previous is now assumed knowledge)
```

Every 5 levels = a "world transition" that changes the visual theme and resets the tension curve slightly before ramping up again.

### What We DON'T Show Early
Following PvZ's approach of delaying peripheral mechanics:
- **Scoring details**: Just show the number going up. Explain combos later
- **Star ratings**: Appear after level 5, once core loop is mastered
- **Bestiary**: Unlocks after encountering 3+ zombie types (after Level 1-3)
- **Leaderboard**: Available from menu but not pushed until World 2
- **Level select worlds**: Only show the current world's levels at first. Locked worlds appear as silhouettes
- **Advanced ammo combos** (tar + fire, ice + boulder): Discovered organically, never explicitly tutorialized

---

## MVP Scope (v1.0)

### Must Have
- [ ] Trebuchet aiming and firing with trajectory preview
- [ ] Matter.js physics world with gravity and collisions
- [ ] Destructible bridges (wood type minimum) with breakable constraints
- [ ] Boulder projectile with impact physics
- [ ] Basic zombie pathfinding (follow path, cross bridges, fall into gaps)
- [ ] Shambler and Runner zombie types
- [ ] Plank Carrier builder zombie (core differentiating mechanic)
- [ ] Wave system with spawn timing
- [ ] Win/lose conditions (gate breach counter)
- [ ] 5 playable levels (World 1: The Foothills)
- [ ] Score system with star ratings
- [ ] Basic HUD (wave counter, score, ammo, gate health)
- [ ] Title screen and level select
- [ ] Touch controls for mobile
- [ ] Web Audio API sound effects
- [ ] Vercel deployment with auto-deploy
- [ ] Leaderboard (Vercel KV)

### Nice to Have (v1.1)
- [ ] Fire Barrel and Chain Shot ammo types
- [ ] Engineer and Ladder zombie builders
- [ ] Stone and iron bridge types
- [ ] Rubble accumulation mechanic
- [ ] World 2: The Gorge (levels 6-10)
- [ ] Parallax backgrounds
- [ ] Slow-motion replay on multi-kills
- [ ] Wind mechanic

### Future (v2.0+)
- [ ] Worlds 3-4 (levels 11-20)
- [ ] All elite zombie types
- [ ] Ice Bomb and Tar Pot ammo
- [ ] Fog of war / night levels
- [ ] Endless mode
- [ ] Procedural level generation
- [ ] Castle upgrades between levels (stronger trebuchet, defensive walls)
- [ ] Multiplayer: one player launches, one player commands zombie waves
- [ ] Procedural music

---

## References

- **Angry Birds** — Projectile physics, structural destruction, star rating system
- **Plants vs. Zombies** — Wave-based defense, enemy variety, builder/counter dynamics
- **Castle Crashers** — Medieval aesthetic, comedic tone
- **Crush the Castle** — Trebuchet siege mechanics, structural physics
- **Bridge Constructor** — Bridge physics and stress simulation
- **Kingdom Rush** — Tower defense progression, world structure
- **Matter.js** — 2D physics engine ([brm.io/matter-js](https://brm.io/matter-js/))
- **Determined** — Sister project, deployment architecture reference ([github.com/Randroids-Dojo/Determined](https://github.com/Randroids-Dojo/Determined))
