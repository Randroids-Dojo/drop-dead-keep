// Drop Dead Keep — Mountain Path & Bridge Layout

import { Bridge, BridgeType } from '../physics/bridge.js';
import { getSprites } from '../sprites/pixel-data.js';
import { drawSprite, drawSpriteAt, drawTiledSprite, setupPixelCanvas } from '../sprites/sprite-renderer.js';

export class GameMap {
  constructor(physics, canvasWidth, canvasHeight) {
    this.physics = physics;
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.bridges = [];
    this.waypoints = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.gatePoint = { x: 0, y: 0 };
    this.paths = []; // visual path segments
    this.cliffs = []; // cliff edges
    this.trees = []; // decorative trees

    // Castle wall
    this.castleY = canvasHeight - 80;
    this.castleWidth = 300;
  }

  loadLevel(levelData) {
    // Clear existing
    this.bridges = [];
    this.waypoints = [];
    this.paths = [];
    this.cliffs = [];
    this.trees = [];

    const w = this.width;
    const h = this.height;

    // Spawn at top of screen (far away)
    this.spawnPoint = levelData.spawnPoint || { x: w / 2, y: 40 };
    // Gate at bottom (close to player)
    this.gatePoint = levelData.gatePoint || { x: w / 2, y: this.castleY - 10 };

    // Create bridges
    for (const bd of (levelData.bridges || [])) {
      const scale = 0.4 + (bd.y / h) * 0.6;
      const bridge = new Bridge(
        this.physics, bd.x, bd.y, bd.width || 80 * scale,
        bd.type || BridgeType.ROPE, scale
      );
      this.bridges.push(bridge);
    }

    // Build waypoints from level data
    this.waypoints = [];
    for (const wp of (levelData.waypoints || [])) {
      const waypoint = { x: wp.x, y: wp.y, bridge: null };
      // Link waypoints to bridges they pass through
      if (wp.bridgeIndex !== undefined && wp.bridgeIndex < this.bridges.length) {
        waypoint.bridge = this.bridges[wp.bridgeIndex];
      }
      this.waypoints.push(waypoint);
    }

    // Generate visual path segments between waypoints
    this.generatePaths();

    // Generate decorative elements
    this.generateTrees(levelData.treeCount || 8);
    this.generateCliffs();
  }

  generatePaths() {
    this.paths = [];
    const allPoints = [
      this.spawnPoint,
      ...this.waypoints,
      this.gatePoint,
    ];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const a = allPoints[i];
      const b = allPoints[i + 1];
      this.paths.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }

  generateTrees(count) {
    this.trees = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = 60 + Math.random() * (this.height - 200);
      // Don't place trees on the path
      let onPath = false;
      for (const p of this.paths) {
        const dist = this.pointToSegmentDist(x, y, p.x1, p.y1, p.x2, p.y2);
        if (dist < 40) { onPath = true; break; }
      }
      if (!onPath) {
        const scale = 0.4 + (y / this.height) * 0.6;
        this.trees.push({ x, y, scale, type: Math.random() > 0.5 ? 'dead' : 'bush' });
      }
    }
  }

  generateCliffs() {
    this.cliffs = [];
    // Add cliff edges near bridges (the chasms)
    for (const bridge of this.bridges) {
      const scale = bridge.scale;
      this.cliffs.push({
        x: bridge.x,
        y: bridge.y,
        width: bridge.width + 40 * scale,
        height: 30 * scale,
        scale,
      });
    }
  }

  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  }

  getZombiePath() {
    return [
      { ...this.spawnPoint },
      ...this.waypoints.map(wp => ({ x: wp.x, y: wp.y, bridge: wp.bridge })),
      { ...this.gatePoint },
    ];
  }

  draw(ctx) {
    setupPixelCanvas(ctx);

    const sprites = getSprites();

    // Sky — solid color bands
    const skyColors = ['#0a0a1a', '#0f0f24', '#14142e', '#1a1a2e', '#2d1b4e'];
    const bandHeight = Math.ceil(this.height / skyColors.length);
    for (let i = 0; i < skyColors.length; i++) {
      ctx.fillStyle = skyColors[i];
      ctx.fillRect(0, i * bandHeight, this.width, bandHeight);
    }

    // Stars — pixel sprites
    for (let i = 0; i < 60; i++) {
      const sx = (Math.sin(i * 127.1 + 33) * 0.5 + 0.5) * this.width;
      const sy = (Math.cos(i * 311.7 + 17) * 0.5 + 0.5) * this.height * 0.5;
      const brightness = 0.3 + (Math.sin(i * 73 + Date.now() * 0.001) * 0.5 + 0.5) * 0.7;
      drawSpriteAt(ctx, sprites.env.star, sx, sy, 1);
    }

    // Moon — pixel sprite
    drawSpriteAt(ctx, sprites.env.moon, this.width - 110, 30, 3);

    // Terrain (cliff faces on sides)
    this.drawTerrain(ctx, sprites);

    // Trees
    this.drawTrees(ctx, sprites);

    // Paths
    this.drawPaths(ctx, sprites);

    // Cliff chasms
    this.drawCliffs(ctx, sprites);

    // Bridges
    for (const bridge of this.bridges) {
      bridge.draw(ctx);
    }

    // Bridge debris
    for (const bridge of this.bridges) {
      bridge.drawDebris(ctx);
    }

    // Castle wall
    this.drawCastle(ctx, sprites);
  }

  drawTerrain(ctx, sprites) {
    // Left cliff strip — tiled with cliff sprites
    const cliffWidth = 45;
    drawTiledSprite(ctx, sprites.env.cliffTile, 0, 0, cliffWidth, this.height, 2);

    // Right cliff strip — tiled with cliff sprites
    drawTiledSprite(ctx, sprites.env.cliffTile, this.width - cliffWidth, 0, cliffWidth, this.height, 2);
  }

  drawPaths(ctx, sprites) {
    for (const p of this.paths) {
      // Path width scales with perspective
      const avgY = (p.y1 + p.y2) / 2;
      const scale = 0.4 + (avgY / this.height) * 0.6;
      const pathWidth = 20 * scale;

      // Tile the path along the segment
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const tileSize = 8 * scale * 2; // pathTile is 8px, scaled
      const steps = Math.max(1, Math.floor(len / tileSize));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const tx = p.x1 + dx * t;
        const ty = p.y1 + dy * t;
        drawTiledSprite(ctx, sprites.env.pathTile, tx - pathWidth / 2, ty - tileSize / 2, pathWidth, tileSize, scale);
      }

      // Grass sprites along edges
      const grassSteps = Math.floor(len / 20);
      for (let i = 0; i <= grassSteps; i++) {
        const t = i / grassSteps;
        const gx = p.x1 + dx * t;
        const gy = p.y1 + dy * t;
        const gs = scale;
        drawSpriteAt(ctx, sprites.env.grassTile, gx - pathWidth / 2 - 8 * gs, gy - 4 * gs, gs);
        drawSpriteAt(ctx, sprites.env.grassTile, gx + pathWidth / 2, gy - 4 * gs, gs);
      }
    }
  }

  drawCliffs(ctx, sprites) {
    for (const cliff of this.cliffs) {
      // Dark chasm fill
      ctx.fillStyle = '#0a0514';
      ctx.fillRect(
        cliff.x - cliff.width / 2,
        cliff.y - cliff.height / 2,
        cliff.width,
        cliff.height
      );

      // Cliff tile border along edges
      const borderH = 4 * cliff.scale;
      // Top border
      drawTiledSprite(ctx, sprites.env.cliffTile,
        cliff.x - cliff.width / 2, cliff.y - cliff.height / 2,
        cliff.width, borderH, cliff.scale);
      // Bottom border
      drawTiledSprite(ctx, sprites.env.cliffTile,
        cliff.x - cliff.width / 2, cliff.y + cliff.height / 2 - borderH,
        cliff.width, borderH, cliff.scale);
    }
  }

  drawTrees(ctx, sprites) {
    // Sort by Y for depth ordering
    const sorted = [...this.trees].sort((a, b) => a.y - b.y);
    for (const tree of sorted) {
      const s = tree.scale;
      if (tree.type === 'dead') {
        // Alternate between two dead tree sprites
        const treeSprite = (Math.floor(tree.x + tree.y) % 2 === 0)
          ? sprites.env.deadTree1
          : sprites.env.deadTree2;
        drawSprite(ctx, treeSprite, tree.x, tree.y, s * 2);
      } else {
        // Bush sprite
        drawSprite(ctx, sprites.env.bush, tree.x, tree.y, s * 2);
      }
    }
  }

  drawCastle(ctx, sprites) {
    const cx = this.width / 2;
    const cy = this.castleY;
    const cw = this.castleWidth;

    // Castle wall — tiled with wall tile
    const wallX = cx - cw / 2;
    const wallY = cy - 20;
    const wallH = 50;
    drawTiledSprite(ctx, sprites.castle.wallTile, wallX, wallY, cw, wallH, 2);

    // Merlons (battlements) along the top
    const merlonW = sprites.castle.merlon.width * 2;
    const merlonH = sprites.castle.merlon.height * 2;
    const merlonCount = Math.floor(cw / (merlonW + 4));
    const merlonSpacing = cw / merlonCount;
    for (let i = 0; i < merlonCount; i++) {
      const mx = wallX + i * merlonSpacing + (merlonSpacing - merlonW) / 2;
      const my = wallY - merlonH;
      drawSpriteAt(ctx, sprites.castle.merlon, mx, my, 2);
    }

    // Gate
    const gateScale = 3;
    const gateW = sprites.castle.gate.width * gateScale;
    const gateH = sprites.castle.gate.height * gateScale;
    drawSpriteAt(ctx, sprites.castle.gate, cx - gateW / 2, cy - 15, gateScale);

    // Torches — animated with two frames
    const frameIndex = Math.floor(Date.now() / 300) % 2;
    const torchSprite = sprites.castle.torch[frameIndex];
    const torchPositions = [cx - cw / 2 + 20, cx + cw / 2 - 20, cx - 60, cx + 60];
    for (const tx of torchPositions) {
      drawSprite(ctx, torchSprite, tx, cy - 20, 2);
    }
  }
}
