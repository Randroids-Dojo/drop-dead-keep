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

The player defends a hilltop castle by launching boulders (and other projectiles) from a catapult to destroy bridges, walkways, and terrain along a winding mountain path. Waves of zombies march uphill toward the castle gates. When a bridge is destroyed, zombies fall into the chasm below. But the undead are resourceful — some carry planks, ladders, and other materials to rebuild crossings or create makeshift paths over gaps.

The game blends **Angry Birds-style projectile physics and structural destruction** with **Plants vs. Zombies-style wave management and enemy variety**. Each level is a multi-lane mountain approach where zombies wind their way up switchback paths connected by destructible bridges.

---

## Core Game Loop

```
┌─────────────────────────────────────────────────┐
│  1. SCOUT — Survey the approaching zombie wave   │
│  2. AIM   — Angle and power the catapult          │
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

The player views the battlefield from **atop the castle walls, looking downhill**. The castle is at the **bottom of the screen** (closest to the player). The winding mountain path stretches AWAY from the castle toward the **top of the screen** (farthest from the player). Zombies spawn at the top and march DOWN the screen toward the castle.

**The Y-axis is the depth axis.** Objects near the top of the screen are far away and appear small. Objects near the bottom are close and appear large. This creates a natural sense of approaching danger — zombies grow larger as they get closer.

### Map Structure (Top-Down Perspective)
```
┌──────────────────────────────────────────────────┐
│ TOP OF SCREEN = FAR AWAY (small scale ~40%)      │
│                                                  │
│  · · · · SPAWN · · · ·   ← Tiny zombies appear  │
│         ╌╌╌╌╌╌╌                                  │
│       ╱ path  ╲                                  │
│  ···BRIDGE 1···           ← Far, hard to hit     │
│       ╲ path  ╱                                  │
│         ╌╌╌╌╌╌╌                                  │
│       ╱ path  ╲                                  │
│  · ·BRIDGE 2· ·           ← Mid-range            │
│       ╲ path  ╱                                  │
│         ╌╌╌╌╌╌╌                                  │
│       ╱ path  ╲                                  │
│   · BRIDGE 3 ·            ← Getting close        │
│       ╲ path  ╱                                  │
│         ╌╌╌╌╌╌╌                                  │
│       ╱ path  ╲                                  │
│    BRIDGE 4               ← Close, easy to hit   │
│       ╲ path  ╱                                  │
│         ╌╌╌╌╌╌╌                                  │
│    BRIDGE 5               ← Last defense!        │
│                                                  │
│  ═══╦════════════════╦═══                        │
│     ║   CASTLE WALL  ║     ← Player is HERE      │
│     ║    [CATAPULT]  ║                            │
│     ║  [🪨] [🔥] [❄] [💣]  ║                      │
│  ═══╩════════════════╩═══                        │
│ BOTTOM OF SCREEN = CLOSE (full scale 100%)       │
└──────────────────────────────────────────────────┘
```

**Perspective scaling:**
- Bridges, zombies, paths, and terrain all scale based on Y-position
- **Bottom (Y=100%)**: Full size, full detail, easy to see and hit
- **Top (Y=0%)**: ~40% size, less detail, hard to target precisely
- Paths narrow with distance (perspective foreshortening)
- Switchback paths zigzag left-right as they ascend the screen
- **Zombies grow larger** as they march down the screen — creates visceral "they're getting closer!" tension

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

The player uses a **slingshot/drag-back mechanic** inspired by Angry Birds but adapted for top-down perspective — drag back from the catapult to aim, a targeting reticle shows where the shot will land, release to fire.

### Perspective & Depth

```
┌──────────────────────────────────────────────┐
│  FAR AWAY (top of screen)                    │
│  · · · tiny zombies · · · tiny bridge · · ·  │  ← Hardest to hit
│                                              │     (most spread)
│     · · zombies · · bridge · ·               │
│                                              │
│       · zombies · · bridge ·                 │  ← Mid-range
│                                              │
│         ZOMBIES    BRIDGE                    │  ← Close range
│                                              │     (easiest)
│  ┌──────────────────────────────────────┐    │
│  │  ═══╦═══   CASTLE WALL   ═══╦═══    │    │
│  │     ║ 🔥                 🔥 ║       │    │
│  │     ╚══════╦══════╦══════╝         │    │
│  │            ║CATPLT║                 │    │
│  │            ╚══════╝                 │    │
│  │   [🪨12] [🔥5] [❄3] [💣1]  AMMO   │    │
│  └──────────────────────────────────────┘    │
│  CLOSE (bottom of screen)                    │
└──────────────────────────────────────────────┘
```

Perspective scaling rules are defined in **The Mountain Map** section above (40% at top → 100% at bottom, with foreshortening on paths).

### Controls

| Action | Keyboard | Mouse/Touch |
|--------|----------|-------------|
| Aim & Power | — | **Drag back from catapult** (down toward bottom of screen) to aim up the mountain |
| Fire | Space (confirm) | **Release drag** |
| Quick-select Ammo | 1-4 keys | Tap ammo icons along bottom bar |
| Camera Pan | Arrow keys / WASD | Two-finger drag |
| Zoom | Scroll wheel | Pinch |

### Aiming System (Slingshot Mechanic)

The aiming uses the Angry Birds drag-back convention but adapted for our **top-down / looking-downhill** perspective. The player drags DOWN (toward the bottom of the screen) to aim UP (toward the top of the screen / farther away).

```
         · · · · ·                    ← Landing zone
        ·    ⊕    ·                      (spread circle)
         · · · · ·
              │
              │  Dotted trajectory
              │  line (straight,
              │  not arced — we're
              │  looking from above)
              │
              │
          ╔══════╗
          ║CATPLT║  ← Drag starts here
          ╚══════╝
              ↕
         [drag down to aim up]
```

**Step-by-step interaction:**

1. **Touch/click the catapult** — The catapult highlights. The loaded ammo appears in the sling cup
2. **Drag DOWNWARD (toward bottom of screen)** — This is the Angry Birds "pull back" convention mapped to our perspective: pulling DOWN aims the shot UPWARD (farther away from the castle, toward the mountain base). Dragging down-left or down-right adjusts the lateral aim (X-axis targeting)
3. **Targeting reticle appears** — Instead of AB's parabolic arc (which doesn't make visual sense from above), we show:
   - A **dotted line** from the catapult to the target point, showing the shot's path
   - A **landing reticle** (circle/crosshair) at the predicted impact point
   - The reticle **grows larger with distance** — representing decreasing accuracy at range (see Accuracy System below)
   - The reticle updates in real-time as the player adjusts drag
4. **Release to fire** — Catapult arm snaps forward. Boulder launches. Brief flight animation shows the projectile shrinking as it flies "away" from the camera (up the screen into the distance)
5. **Impact** — Boulder lands within the reticle zone. Screen shake scales with distance (bigger shake for close hits, subtle rumble for far hits). Destruction physics play out

**Aiming physics:**
- **Drag distance (Y-axis)** = range / distance up the mountain. Short drag = close target (near the castle). Long drag = far target (near zombie spawn)
- **Drag offset (X-axis)** = lateral aim. Drag down-left to aim right, drag down-right to aim left (inverted, like pulling a slingshot)
- **Snap-back cancel** — if the player drags back to the catapult origin (very short distance), releasing cancels the shot without firing

### Accuracy System (Distance = Spread)

The farther the target, the less accurate the shot. This is the core skill mechanic that replaces Angry Birds' arc-trajectory skill.

```
CLOSE TARGET (bottom 1/3):     MID TARGET (middle 1/3):     FAR TARGET (top 1/3):
     · ·                            · · · ·                     · · · · · · ·
    · ⊕ ·                         ·   ⊕   ·                  ·      ⊕      ·
     · ·                            · · · ·                     · · · · · · ·
  Tight reticle               Medium reticle               Wide reticle
  ~95% accuracy               ~75% accuracy                ~50% accuracy
  Easy to hit bridge          Some randomness              Real risk of missing
```

**How accuracy works:**
- The **landing reticle circle** represents the zone where the boulder might land
- At close range, the circle is tiny — the boulder lands almost exactly where aimed
- At far range, the circle is large — the boulder lands randomly within the zone
- The actual impact point is randomized within the reticle, biased toward the center (gaussian distribution — most shots land near the crosshair, but some scatter to edges)
- **Ammo types affect accuracy**: Boulders are standard. Ice Bombs have tighter spread (precision weapon). Mega Bombs have wide spread but it doesn't matter (huge blast radius)

**Why this works for our game:**
- **Close bridges are easy to destroy** — lets early levels feel satisfying
- **Far bridges require multiple shots** — creates resource tension (do I spend 3 boulders on the far bridge or save them?)
- **Engineers near the spawn are hard to snipe** — they're far away and small, so killing them requires skill or special ammo
- **Zombies get easier to hit as they get closer** — creates natural tension curve: you WANT to stop them far away but it's HARDER to do so
- **Rewards precision** — skilled players who learn to compensate for spread feel masterful
- **Splash damage compensates** — Fireball and Mega Bomb have area effects that offset poor accuracy at range

**Visual feedback during aim:**
- Catapult arm bends as player drags (elastic visual)
- Targeting line stretches from catapult to reticle
- Reticle circle GROWS as target distance increases — player can see accuracy decreasing in real-time
- Reticle color shifts: green (close/accurate) → yellow (mid) → red (far/inaccurate)
- Ammo glows brighter as range increases
- At max range, reticle pulses red — "you can try, but you'll probably miss"

**Wind (harder difficulties):**
- Small arrow + number appears at top of screen showing wind direction and strength
- Wind shifts the reticle laterally — the landing zone drifts left or right
- Player must compensate by aiming upwind
- Wind changes between waves, not between shots (so player can plan)

**After firing:**
- Brief reload animation (catapult arm resets, new ammo loads)
- Reload time varies by ammo type
- During reload, player can pan the camera to survey damage
- Next ammo auto-loads (same type) unless player switches
- Boulder flight animation: projectile shrinks and darkens as it flies "away" into the distance, then IMPACT with dust/debris cloud at the landing point

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

Zombies approach in waves with escalating difficulty. Each type has distinct behavior, speed, and **specific interactions with terrain, bridges, gaps, and ammo types**. The Bestiary rates each on a 6-pip scale: HP, SPD (speed), DMG (gate damage), ARM (armor/projectile resistance).

### Common Zombies

#### Shambler
| Stat | Rating | | |
|------|--------|-|-|
| HP | 1/6 | **Rarity** | Common |
| SPD | 1/6 | **Unlock** | Level 1-1 (starting enemy) |
| DMG | 1/6 | **Visual** | Classic green zombie, slouched posture, arms forward |
| ARM | 0/6 | | |

**Behavior:** The basic zombie. Walks slowly in a straight line following the path. Travels in packs of 3-8.

**World interactions:**
- **Destroyed bridge** → Falls into the gap. Comedic scream, splat. Dead.
- **Damaged bridge** → Walks across cautiously (slower). Bridge may collapse under them if weakened enough (< 25% HP)
- **Rubble pile in gap** → If enough debris has accumulated from destroyed bridges, Shamblers can stumble across the rubble. This punishes players who destroy bridges in the center (debris piles up) vs. the edges (debris scatters)
- **Frozen surface (Ice Bomb)** → Slides uncontrollably, may slide off the path or into a gap
- **Tar zone** → Slowed to 50% speed. Vulnerable to fire combo
- **Fire zone** → Takes burn damage over time, keeps walking
- **Direct boulder hit** → Instant kill (1 HP)

**Why they matter:** Cannon fodder that teaches the basic loop. Their weakness to EVERYTHING makes the player feel powerful early on.

---

#### Sprinter
| Stat | Rating | | |
|------|--------|-|-|
| HP | 1/6 | **Rarity** | Common |
| SPD | 5/6 | **Unlock** | Level 1-3 |
| DMG | 1/6 | **Visual** | Lean zombie, leaning forward, legs blurred with speed lines |
| ARM | 0/6 | | |

**Behavior:** Runs at 3x Shambler speed. Moves in bursts — sprints between bridges, briefly pauses at each crossing to "assess" (0.5s), then sprints again.

**World interactions:**
- **Destroyed bridge** → Can **leap small gaps** (< 2 tile widths). If the bridge is fully destroyed leaving a wide gap, they fall in. If only partially destroyed (a few planks missing), they can jump across
- **Damaged bridge** → Runs across at full speed without slowing — doesn't care about creaking wood
- **Rubble pile** → Can jump over small rubble piles that would slow Shamblers
- **Frozen surface** → Slides much farther than Shamblers due to momentum. Often slides completely off the path — effective counter
- **Tar zone** → Slowed to normal Shambler speed (major nerf). Tar is the hard counter
- **Direct boulder hit** → Hard to hit because of speed + they're often far away (small target). Splash damage from Fireball is more effective
- **At the gate** → Arrives first, starts doing chip damage before the horde catches up

**Why they matter:** Forces players to fully destroy bridges (not just damage them). Punishes lazy play. Creates urgency — "they're already at Bridge 3 while I'm still aiming at Bridge 1!"

---

#### Brute
| Stat | Rating | | |
|------|--------|-|-|
| HP | 5/6 | **Rarity** | Uncommon |
| SPD | 1/6 | **Unlock** | Level 2-3 |
| DMG | 4/6 | **Visual** | Massive, hulking green zombie. Twice the size of Shamblers. Visible muscles, heavy jaw |
| ARM | 3/6 | | |

**Behavior:** Slow, extremely tough. Walks with ground-shaking footsteps (subtle screen vibration). Other zombies cluster behind Brutes, using them as moving shields.

**World interactions:**
- **Destroyed bridge** → Falls in like everyone else. BUT: due to mass, the impact at the bottom creates a larger rubble pile, making it easier for later zombies to cross the debris
- **Damaged bridge** → Can **bash through weakened bridges** (< 50% HP) instead of crossing normally. The bridge collapses under their weight but they survive and continue walking on the debris. This means a half-destroyed bridge is WORSE than an intact one when a Brute approaches — they'll destroy it AND create a rubble crossing
- **Intact bridge** → Walks across normally. Bridge shakes and loses 10% HP from the weight alone
- **Rubble pile** → Walks straight through, compacting the rubble into a more stable crossing for following zombies
- **Frozen surface** → Too heavy to slide. Ice cracks under them but barely slows them. Ice Bomb is ineffective
- **Tar zone** → Slowed to 25% speed (their heavy feet stick). Very effective counter
- **Fire zone** → Takes burn damage but high HP means they survive multiple ticks
- **Direct boulder hit** → Takes damage but survives 2-3 hits. Knocked back slightly on impact (only zombie type that gets knockback instead of dying)
- **Fireball** → Effective: area burn damage stacks against their slow movement
- **At the gate** → Deals massive gate damage per hit (4/6). Two Brutes at the gate can end a level fast

**Why they matter:** Forces strategic thinking about bridge damage. A half-destroyed bridge + incoming Brute = worse outcome than either a fully intact or fully destroyed bridge. Players learn to commit fully to bridge destruction.

---

#### Screecher
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Uncommon |
| SPD | 3/6 | **Unlock** | Level 3-3 |
| DMG | 2/6 | **Visual** | Purple/ethereal zombie, mouth wide open, visible sound waves emanating. Smaller, hunched |
| ARM | 0/6 | | |

**Behavior:** Walks at medium speed. Every 5 seconds, **screams** — emitting visible purple sound-wave rings that buff all zombies within a radius.

**World interactions:**
- **Scream buff** → All zombies within 3-tile radius get +50% speed for 4 seconds. This includes Brutes (suddenly dangerous), Sprinters (nearly uncatchable), and Engineers (repair faster)
- **Destroyed bridge** → Falls in. The scream dies with them — all buffed zombies immediately lose the speed boost. Killing a Screecher mid-scream feels incredibly satisfying
- **Multiple Screechers** → Scream buffs STACK. Two Screechers near each other = +100% speed for nearby zombies. Nightmarish
- **Frozen surface** → Scream shatters ice in the area (thematic: sonic vibration). Cancels Ice Bomb effects nearby
- **Direct hit** → Low HP, dies easily. BUT they tend to walk in the middle of packs, making them hard to hit without splash damage
- **Positioning** → Always spawns in the CENTER of a zombie group, shielded by surrounding zombies

**Why they matter:** Priority target. Creates a "find the Screecher" mini-game within each wave. Rewards splash damage weapons (Fireball catches the whole pack). Punishes players who ignore them — a buffed wave moves terrifyingly fast.

---

### Builder Zombies (The Core Twist)

Builder zombies are the **key mechanic** that distinguishes Drop Dead Keep. They carry materials and can rebuild or bypass destroyed crossings. Each builder type counters a specific defensive strategy.

#### Engineer
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Uncommon |
| SPD | 2/6 | **Unlock** | Level 1-4 |
| DMG | 1/6 | **Visual** | Green zombie with hard hat, tool belt, carrying wooden planks and hammer |
| ARM | 1/6 | | |

**Behavior:** Walks toward the nearest destroyed bridge. When it reaches a gap, it stops and begins a **4-step repair sequence** (see World Art concept):

```
1. ARRIVES (walks to gap edge)     → 0.5s
2. PLACES PLANK (lays board)       → 1.5s  ← Progress bar starts
3. HAMMERS (builds the crossing)   → 3.0s  ← Stationary, easy to hit!
4. COMPLETE (bridge restored)      → Bridge at 50% HP
```

**World interactions:**
- **Destroyed bridge** → Repairs it to 50% HP (partial restoration). The rebuilt bridge is weaker than the original — one more boulder hit destroys it again
- **Partially destroyed bridge** → Repairs to 75% HP. Can restore damaged bridges too
- **While repairing** → Must stand still for ~5 seconds total. Stationary target. This is the player's window — Engineers are the easiest zombie to snipe IF you spot them in time
- **Killed while repairing** → Drops materials. Repair progress resets. Another Engineer must start over
- **Multiple Engineers** → Can repair simultaneously on different bridges. Overwhelms the player's ability to snipe them all
- **Fire zone** → Tools catch fire. Engineer panics and runs around briefly before dying. Does NOT repair while on fire
- **Frozen** → Repair paused while frozen. Timer resumes when thaw
- **Rubble pile** → Ignores rubble. Only repairs proper bridge structures

**Why they matter:** THE defining mechanic. Without Engineers, the game would be "destroy all bridges, win." Engineers force constant re-engagement with already-cleared areas. They turn the game from a puzzle into a dynamic tug-of-war.

---

#### Plank Carrier
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Uncommon |
| SPD | 1/6 | **Unlock** | Level 2-4 |
| DMG | 1/6 | **Visual** | Shambler carrying 2-3 wooden planks on its back. Planks extend above its head, making it a taller target |
| ARM | 0/6 | | |

**Behavior:** Walks toward the nearest gap. When it reaches a destroyed bridge, it drops its planks across the gap to create a **makeshift walkway**. Does NOT rebuild the bridge — just lays boards flat.

**World interactions:**
- **Destroyed bridge** → Drops planks across the gap. Creates a narrow, fragile crossing (1 tile wide). Other zombies can walk across single-file
- **Plank crossing** → Planks have very low HP (1 hit from any ammo destroys them). But if the player doesn't notice, an entire wave can cross
- **Killed before reaching gap** → Drops planks where it dies. Planks become inert debris on the path (cosmetic, no gameplay effect)
- **Fire** → Planks are wood — Fireball ignites them. Burning planks collapse after 2 seconds, dropping any zombie on them into the gap. VERY satisfying combo
- **Ice** → Planks become slippery. Zombies crossing have a 50% chance of sliding off into the gap
- **Multiple Plank Carriers** → Can stack planks to create a wider, more stable crossing (2-3 planks = safe walkway). Must destroy quickly before they accumulate
- **Brute on planks** → Planks immediately snap under the weight. Brute falls in. Hilarious

**Why they matter:** Creates a "whack-a-mole" dynamic. Even after destroying a bridge, you must watch for Plank Carriers laying quick fixes. Rewards vigilance and fire ammo.

---

#### Ladder Zombie
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Rare |
| SPD | 2/6 | **Unlock** | Level 3-4 |
| DMG | 1/6 | **Visual** | Zombie carrying a tall wooden ladder vertically on its back. Very tall profile, easy to spot but hard to hit (narrow) |
| ARM | 0/6 | | |

**Behavior:** Instead of following the winding switchback path, Ladder Zombies head for **cliff edges** and prop their ladder against the cliff face to create a shortcut. They bypass bridges entirely — climbing straight up/down between path levels.

**World interactions:**
- **Cliff edge** → Props ladder against the cliff. Other zombies can now climb the ladder to skip an entire switchback section (bypasses 1-2 bridges)
- **Ladder placed** → Ladder stays permanently until destroyed. Has moderate HP (2 boulder hits). Creates an alternate route that persists across waves
- **Boulder near ladder** → Splash damage can knock the ladder over. Must hit within ~2 tiles of the ladder base
- **Fire** → Ladder is wood — burns and collapses after 3 seconds
- **Killed before placing** → Drops ladder on the ground. Inert
- **Multiple ladders** → Multiple shortcuts = zombies reach the gate much faster, bypassing most of the path. Critical threat in late game
- **Ice on cliff** → Ladder becomes slippery. Zombies fall off mid-climb

**Why they matter:** Forces players to think beyond bridges. Even if every bridge is destroyed, Ladder Zombies can create entirely new routes. Players must watch the cliff edges, not just the bridges.

---

#### Rope Thrower
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Rare |
| SPD | 2/6 | **Unlock** | Level 3-1 |
| DMG | 1/6 | **Visual** | Zombie with coiled rope over one shoulder and a grappling hook in hand |
| ARM | 0/6 | | |

**Behavior:** When it reaches a wide gap (too wide for planks), it throws a grappling hook across and anchors a rope. Creates a single-file rope crossing that zombies traverse slowly, hand-over-hand.

**World interactions:**
- **Wide gap** → Throws rope across. Rope crossing is slow (zombies move at 25% speed on rope) but functional
- **Rope HP** → Very fragile — any direct hit on the rope OR either anchor point snaps it. All zombies currently on the rope fall into the gap
- **Multiple zombies on rope** → Creates a satisfying cascade when cut — 3-4 zombies fall in sequence
- **Fire** → Rope burns instantly. Snap + cascade
- **Wind** → Rope swings, making crossing even slower (10% speed in wind)
- **Killed before throwing** → Rope coils on ground. Inert

**Why they matter:** Counters the "wide gap = permanent safety" assumption. Forces players to maintain vigilance over gaps they thought were secure. The rope-cutting cascade is one of the most satisfying moments in the game.

---

#### Raft Builder
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Rare |
| SPD | 1/6 | **Unlock** | Level 2-2 (World 2: water crossings) |
| DMG | 1/6 | **Visual** | Zombie carrying logs and vine bindings. Stocky, hunched under the weight |
| ARM | 0/6 | | |

**Behavior:** Only relevant at water crossings (chasms with water instead of empty drops). Builds a small raft and floats across, completely ignoring the bridge above.

**World interactions:**
- **Water crossing** → Builds raft in 3 seconds. Floats across at Shambler speed. Other zombies can ride if they arrive in time (max 3 per raft)
- **Direct hit on raft** → Raft sinks. All passengers drown. Raft debris floats downstream
- **Fire** → Logs are slow to ignite (wet wood). Fireball not very effective on rafts
- **Ice Bomb** → VERY effective. Freezes the water surface — raft gets stuck in ice. Zombies stranded on frozen raft become sitting ducks
- **Boulder in water** → Creates splash that rocks nearby rafts. Zombies may fall off into water
- **Current (some levels)** → Water flows, pushing rafts downstream. Raft may miss the landing point

**Why they matter:** Introduces a water terrain type that requires different counterplay. Bridges over water can be destroyed safely (debris sinks, no rubble pile), but Raft Builders bypass the bridge entirely.

---

### Elite Zombies (Late Game)

Elite zombies are rare, powerful, and dramatically change the flow of a wave. Only 1-2 appear per wave. They're visually imposing — even at the far end of the screen, their silhouette is unmistakable.

#### Shield Bearer
| Stat | Rating | | |
|------|--------|-|-|
| HP | 3/6 | **Rarity** | Rare |
| SPD | 2/6 | **Unlock** | Level 2-5 |
| DMG | 2/6 | **Visual** | Zombie carrying a large wooden door/shield held overhead like an umbrella. Shield has nails and rivets visible |
| ARM | 5/6 (with shield) → 0/6 (without) | | |

**Behavior:** Holds shield above its head, blocking incoming projectiles from above (remember: player fires from the castle DOWNWARD). Shield absorbs one hit before shattering, leaving the zombie exposed.

**World interactions:**
- **Boulder from above** → Shield absorbs the hit. Shield shatters with satisfying wood-splintering effect. Zombie now unshielded and vulnerable
- **Fireball** → Shield catches fire and burns away over 2 seconds. Zombie takes burn damage even with shield up (fire spreads around it)
- **Ice Bomb** → Freezes both shield and zombie. Shield becomes brittle — next hit shatters both shield and zombie
- **Splash damage** → Shield only protects from direct overhead hits. Splash damage from a nearby impact can hit the zombie from the side
- **Destroyed bridge** → Falls in like normal. Shield doesn't help with falling
- **Other zombies walk behind** → Shield Bearer's shield provides overhead cover for zombies directly behind it (1-2 tiles). Creates a "convoy" effect
- **At the gate** → Bashes gate with the shield for bonus damage on first hit

**Why they matter:** Punishes single-target boulder spam. Rewards tactical ammo choices (fire to burn shield, ice to make it brittle) and splash damage. The "convoy" effect means killing the Shield Bearer first exposes the group behind them.

---

#### Necromancer
| Stat | Rating | | |
|------|--------|-|-|
| HP | 2/6 | **Rarity** | Elite |
| SPD | 1/6 | **Unlock** | Level 3-2 |
| DMG | 1/6 | **Visual** | Robed zombie with glowing purple eyes and raised arms. Floats slightly above the ground. Purple energy trails |
| ARM | 0/6 | | |

**Behavior:** Walks slowly. Every 8 seconds, raises arms and casts a **resurrect pulse** — any zombie that died within a 4-tile radius in the last 30 seconds rises again with 50% HP.

**World interactions:**
- **Resurrect pulse** → Dead zombies rise as "Risen" variants — slightly faster, greenish-purple glow, 50% of original HP. Even zombies that fell into gaps can climb back out if the gap is shallow enough
- **Killed zombies near Necromancer** → Will be resurrected unless the Necromancer is killed first. Creates a priority target dynamic — kill the Necromancer BEFORE killing the horde, or they'll just come back
- **Necromancer killed** → All Risen zombies immediately collapse. Satisfying cascade of zombie deaths
- **Fire** → Effective. Sets robes ablaze. Cannot cast while burning (3-second interrupt)
- **Ice** → Freezes the Necromancer but does NOT stop an active resurrect pulse already in progress
- **Destroyed bridge** → Falls in. Resurrect pulses cannot reach zombies that fell into deep gaps (below a certain Y-depth threshold)
- **Multiple Necromancers** → Extremely dangerous. Can resurrect each OTHER if positioned right. Must be killed simultaneously or in quick succession

**Why they matter:** Completely changes the kill priority. Normally, you kill whatever's closest. With a Necromancer present, you must target them FIRST (even though they're usually in the back of the pack). Rewards precision aiming and splash damage to hit the protected Necromancer within the horde.

---

#### Siege Tower
| Stat | Rating | | |
|------|--------|-|-|
| HP | 6/6 | **Rarity** | Elite |
| SPD | 0.5/6 | **Unlock** | Level 4-3 |
| DMG | 3/6 | **Visual** | Massive wooden tower on wheels, pushed by 4 Shamblers. Visible ropes, wooden beams, crude wheels. Towers above everything else on screen, even at distance |
| ARM | 4/6 | | |

**Behavior:** A mobile structure pushed by 4 Shamblers. Moves extremely slowly. When it reaches a gap, it falls forward like a drawbridge, creating a PERMANENT wide crossing that's much harder to destroy than planks.

**World interactions:**
- **Destroyed bridge** → Topples forward across the gap. Creates a massive, durable crossing (takes 3-4 boulder hits to destroy). All zombies can cross freely
- **Intact bridge** → Passes over normally, continuing to the next gap
- **Fire** → Very effective! The tower is all wood. Fireball sets it ablaze — burns for 5 seconds, then collapses. If it collapses while spanning a gap, it takes any zombies on it down too
- **Ice** → Freezes the wheels. Pushing Shamblers slip on the ice and lose formation. Tower stops for 5 seconds
- **Boulder** → Chunks break off but tower continues. Must hit 3-4 times to destroy. Each hit knocks off one of the pushing Shamblers (tower slows 25% per lost pusher)
- **Kill the pushers** → With all 4 Shamblers dead, the tower stops permanently. Becomes a static obstacle blocking the path (zombies must walk around it)
- **Mega Bomb** → One-shots the tower. This is the Mega Bomb's designed "aha" moment

**Why they matter:** The "boss enemy." Forces players to use their best ammo. Creates dramatic tension — you can see the tower slowly approaching from the top of the screen for an entire wave. Fire and Mega Bomb become essential. Killing the pushers is a creative alternative strategy.

---

#### Giant
| Stat | Rating | | |
|------|--------|-|-|
| HP | 6/6 | **Rarity** | Elite |
| SPD | 0.5/6 | **Unlock** | Level 4-5 (final levels) |
| DMG | 6/6 | **Visual** | Enormous zombie, 3x the size of a Brute. Visible even at the far end of the screen. Ground cracks under each step. Tiny zombies walk between its legs |
| ARM | 5/6 | | |

**Behavior:** Walks with earth-shaking footsteps (screen vibration every 2 seconds). So massive it can WADE through shallow chasms — destroyed bridges don't stop it unless the gap is very deep.

**World interactions:**
- **Shallow gap (< 3 tiles deep)** → Wades through. Doesn't even slow down. This is terrifying — the one enemy that ignores your primary mechanic
- **Deep gap (≥ 3 tiles)** → Falls in. But takes 2-3 seconds to actually fall (grabs the edge, struggles). Player can hear it groaning. Satisfying delayed payoff
- **Damaged bridge** → Collapses the bridge just by walking on it. No bridge survives a Giant
- **Rubble** → Kicks rubble aside, clearing the pile. Actually helps the player by preventing rubble crossings
- **Boulder** → Barely notices. Takes 5-6 hits to kill. Each hit staggers it briefly (0.5s pause) but no knockback
- **Fireball** → Moderate damage. Giant swats at the flames, creating a brief fire splash that can damage nearby zombies (friendly fire)
- **Ice Bomb** → Slows for 3 seconds but cannot fully freeze. Too massive
- **Mega Bomb** → Deals 60% of Giant's HP. The only ammo that meaningfully damages it in one shot
- **Other zombies** → Small zombies walk between the Giant's legs, protected from overhead projectiles by its body mass
- **At the gate** → Deals catastrophic damage. 2 hits from a Giant = gate destroyed. THE highest priority target
- **Killed** → Falls forward with a massive screen-shaking impact. Crushes any zombies directly in front of it. Creates a rubble pile from its own body that blocks the path for 10 seconds

**Why they matter:** The ultimate test. Forces players to commit EVERYTHING — Mega Bombs, sustained boulder fire, tactical ammo combos. The fact that it can wade through shallow gaps means players need deep chasms (multiple bridge destructions) or concentrated firepower. Its death animation (crushing everything in front of it) rewards the kill dramatically.

---

### Zombie Interaction Matrix

Quick reference for how each zombie type interacts with key game elements:

| Zombie | Destroyed Bridge | Damaged Bridge | Rubble Pile | Ice | Fire | Tar | Boulder | Best Counter |
|--------|-----------------|----------------|-------------|-----|------|-----|---------|-------------|
| **Shambler** | Falls in | Crosses slowly | Can cross | Slides off | Burns | Slowed 50% | 1-hit kill | Any bridge destruction |
| **Sprinter** | Jumps small gaps | Runs across | Jumps over | Slides far off | Burns | Slowed to Shambler speed | Hard to hit | Tar + bridge destruction |
| **Brute** | Falls in (big rubble) | Bashes through if <50% | Compacts it | Barely affected | Burns slowly | Slowed 75% | 2-3 hits, knockback | Full bridge destruction + fire |
| **Screecher** | Falls in | Crosses | Crosses | Shatters nearby ice | Burns | Slowed | 1-2 hits | Splash damage into pack |
| **Engineer** | Repairs it! | Repairs it! | Ignores | Frozen, paused | Panics, dies | Slowed | 1-2 hits | Snipe while repairing |
| **Plank Carrier** | Drops planks across | Crosses | Crosses | Planks slippery | Planks burn! | Slowed | 1 hit | Fire ammo |
| **Ladder Zombie** | Bypasses via cliff | Uses ladder instead | Bypasses | Ladder slippery | Ladder burns | Slowed | 1-2 hits | Watch cliff edges |
| **Rope Thrower** | Throws rope across | Uses rope | Throws rope | Rope frozen stiff | Rope burns! | Slowed | 1 hit | Hit the anchor |
| **Raft Builder** | N/A (water only) | N/A | N/A | Water freezes, stuck | Wet wood resists | N/A | Sink raft | Ice Bomb |
| **Shield Bearer** | Falls in | Crosses | Crosses | Brittle shield | Burns shield away | Slowed | Shield blocks 1 hit | Fire or splash |
| **Necromancer** | Falls in | Crosses | Crosses | Frozen, can't cast | Burns, interrupted | Slowed | 1-2 hits | Kill FIRST |
| **Siege Tower** | Bridges the gap! | Crushes it | Rolls over | Wheels freeze | Burns down! | Wheels stick | 3-4 hits | Fire or Mega Bomb |
| **Giant** | Wades through shallow | Collapses it | Kicks aside | Barely slowed | Swats at flames | Slowed | 5-6 hits | Mega Bomb + deep gaps |

---

## Dual-Phase Gameplay

The game features **two distinct gameplay phases** that alternate during each level:

### Phase 1: Slingshot (Bridge Breaker)
The primary gameplay mode. Top-down view looking downhill from the castle walls. Player launches projectiles from the catapult to destroy bridges and kill zombies on the winding mountain path. This is the strategic, physics-based phase.

### Phase 2: Gate Defense
When zombies reach the castle wall, the camera **zooms in to a close-up** of the battlements. The player sees the castle gate (with an iron portcullis) and the horde massing just beyond the wall. The player deploys defensive items by tapping/clicking below the wall:

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
- **Oil Slicks**: Pre-placed on some bridges — ignitable with Fireball for area denial

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

### Wave Composition Example (Level 1-5, World 1 Finale)

| Wave | Zombies | Composition |
|------|---------|-------------|
| 1 | 8 | 8 Shamblers — learn the basics |
| 2 | 12 | 10 Shamblers + 2 Sprinters — speed pressure |
| 3 | 15 | 8 Shamblers + 4 Sprinters + 3 Engineers — **builders introduced** |
| 4 | 20 | 10 Shamblers + 4 Sprinters + 4 Engineers + 2 Plank Carriers |
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
- **Enemies**: Shamblers, Sprinters, Engineers
- **Ammo**: Boulders only (Fireball unlocked at Level 1-5)
- **Teaching**: Core loop — aim, fire, destroy, survive

### World 2: The Gorge (Levels 6-10)
- **Theme**: Deep canyon, rushing river below, stone bridges
- **Bridges**: Stone and iron added
- **Enemies**: + Brutes, Engineers, Ladder Zombies
- **Ammo**: + Fireball (Level 2-1), Ice Bomb (Level 2-5)
- **Mechanic Intro**: Water crossings, raft builders, rubble accumulation matters

### World 3: The Dark Approach (Levels 11-15)
- **Theme**: Night, fog, volcanic rock, lava chasms
- **Bridges**: Mix of all types, some pre-damaged
- **Enemies**: + Rope Throwers, Shield Bearers, Necromancers
- **Ammo**: + Mega Bomb (Level 3-4)
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
| Catapult fire | Deep thwack + whoosh |
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
      catapult.js             # Player weapon, aim & fire
      zombie.js               # Base zombie class
      zombie-types.js         # Shambler, Sprinter, Brute, etc.
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
  "ammo": "fireball"
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
- Catapult range: Full map coverage with power adjustments
- Special ammo per wave: 2-4 shots depending on type

### Zombie Balance
- Time from spawn to gate (unimpeded): ~45 seconds for Shambler, ~25 seconds for Sprinter
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
2. **Do Over Read** — The first level teaches that you drag the catapult, projectiles fly toward the target, and bridges break. Zero text needed — the player sees the result of their action and understands
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
- Player drags backward — targeting line and landing reticle appear in real-time
- Text disappears as soon as player starts dragging
- If player releases too early (weak shot), gentle prompt:
  "Pull back further for more power!"

Step 3: (no text — player releases, boulder flies)
────────────────────────────────────────────
- Boulder flies up the screen into the distance — camera FOLLOWS the projectile
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
- 3 Shamblers spawn at top of screen, march slowly downward
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
- If zombies DO cross, they continue down path — player sees gate
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

### Defeat Screen

When the gate falls, a **dramatic defeat screen** appears (inspired by Angry Birds' menacing pig gloat screen):

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│     [Dark red/orange radial burst background]        │
│                                                      │
│        ╔══════════════════════════╗                   │
│        ║   ZOMBIES  clustered    ║                   │
│        ║   around broken gate,   ║                   │
│        ║   grinning smugly at    ║                   │
│        ║   the camera            ║                   │
│        ╚══════════════════════════╝                   │
│                                                      │
│           THE GATE HAS FALLEN                        │
│                                                      │
│              [ RETRY ]                               │
│                                                      │
│      (back arrow)          (level select)             │
└──────────────────────────────────────────────────────┘
```

**Defeat screen design:**
- **Enemies gloat** — zombies cluster around the broken gate, looking directly at the camera with smug grins. Makes the player want revenge
- **Dramatic lighting** — dark red/orange radial burst, ominous tone
- **No punishment** — retry is free and instant (unlike Angry Birds' token cost). We want players to immediately try again, not feel penalized
- **Quick stats** — brief summary: "Wave 3 of 5 • 12 zombies stopped • 3 breached"
- **Failure coaching** — if this is the player's first death on this level, a small tip appears below the retry button: "Tip: Destroy the lower bridges first to thin the horde early"

### Ammo Key Unlock System (Player Choice)

Inspired by Angry Birds 2's "Bird key found! Use it to release any bird!" system — at certain milestones, the player earns an **Ammo Key** and CHOOSES which weapon to unlock next.

```
┌──────────────────────────────────────────────────────────┐
│                AMMO KEY FOUND!                           │
│          Choose your next weapon!                        │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │FIREBALL│ │ICE BOMB│ │  MEGA  │ │  TAR   │            │
│  │  🔥    │ │  ❄️    │ │  BOMB  │ │  POT   │            │
│  │        │ │  🔒    │ │  🔒   │ │  🔒   │            │
│  │Rec'd!  │ │        │ │        │ │        │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                          │
│  Burns wood    Freezes     Massive     Slows +           │
│  bridges.      zombies.    blast.      flammable.        │
│  Area damage.  Shatters    Destroys    Combo with        │
│               bridges.    sections.   fire.              │
│                                                          │
│              [ UNLOCK FIREBALL ]                         │
└──────────────────────────────────────────────────────────┘
```

**Ammo Key rules:**
- **Earned at World milestones** — completing World 1 (Level 1-5), midway through World 2 (Level 2-3), completing World 2 (Level 2-5), etc.
- **Player chooses** which ammo to unlock — agency and replayability
- **"Recommended!"** tag on the most useful option for the upcoming levels — guides without forcing
- **Locked ammo shown in cages/cases** — visual anticipation (like AB2's caged birds)
- **Info button** on each option — tap to preview the ammo's effect in a short animation
- **Choice is permanent** for that playthrough — other ammo can be unlocked with later keys. Encourages replaying the game with different unlock orders
- **All ammo eventually unlockable** — no FOMO, just ordering preference

This gives players meaningful choice while maintaining the drip-feed pacing of PvZ.

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

Step 2: "Try to destroy the farther bridge first!"
────────────────────────────────────────────
- Arrow points to Bridge 1 (the upper one on screen, closer to zombie spawn)
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
- 4 Shamblers march down from spawn at top of screen
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
│    Zombies shuffling into formation at the top (far away)    │
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
| **1-1** | Catapult + Boulder | — | Drag-to-aim, targeting reticle, release to fire. Destroy a single rope bridge. | 5 Shamblers (single file) |
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
- [ ] Catapult aiming and firing with targeting reticle
- [ ] Matter.js physics world with gravity and collisions
- [ ] Destructible bridges (wood type minimum) with breakable constraints
- [ ] Boulder projectile with impact physics
- [ ] Basic zombie pathfinding (follow path, cross bridges, fall into gaps)
- [ ] Shambler and Sprinter zombie types
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
- [ ] Fireball and Ice Bomb ammo types
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
- [ ] Mega Bomb ammo
- [ ] Fog of war / night levels
- [ ] Endless mode
- [ ] Procedural level generation
- [ ] Castle upgrades between levels (stronger catapult, defensive walls)
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
