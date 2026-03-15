// Drop Dead Keep — Mountain Path & Bridge Layout

import { Bridge, BridgeType } from '../physics/bridge.js';

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
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0a0a1a');
    skyGrad.addColorStop(0.4, '#1a1a2e');
    skyGrad.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = (Math.sin(i * 127.1 + 33) * 0.5 + 0.5) * this.width;
      const sy = (Math.cos(i * 311.7 + 17) * 0.5 + 0.5) * this.height * 0.5;
      const brightness = 0.3 + (Math.sin(i * 73 + Date.now() * 0.001) * 0.5 + 0.5) * 0.7;
      ctx.fillStyle = `rgba(255, 255, 220, ${brightness * 0.5})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Moon
    ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
    ctx.beginPath();
    ctx.arc(this.width - 80, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.arc(this.width - 70, 55, 22, 0, Math.PI * 2);
    ctx.fill();

    // Terrain (cliff faces on sides)
    this.drawTerrain(ctx);

    // Trees
    this.drawTrees(ctx);

    // Paths
    this.drawPaths(ctx);

    // Cliff chasms
    this.drawCliffs(ctx);

    // Bridges
    for (const bridge of this.bridges) {
      bridge.draw(ctx);
    }

    // Bridge debris
    for (const bridge of this.bridges) {
      bridge.drawDebris(ctx);
    }

    // Castle wall
    this.drawCastle(ctx);
  }

  drawTerrain(ctx) {
    // Ground/terrain gradient
    const terrainGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    terrainGrad.addColorStop(0, 'rgba(40, 30, 20, 0.3)');
    terrainGrad.addColorStop(0.5, 'rgba(50, 35, 25, 0.5)');
    terrainGrad.addColorStop(1, 'rgba(60, 40, 30, 0.7)');

    // Left terrain edge
    ctx.fillStyle = terrainGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let y = 0; y <= this.height; y += 20) {
      const x = 30 + Math.sin(y * 0.02) * 15 + Math.sin(y * 0.05) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Right terrain edge
    ctx.beginPath();
    ctx.moveTo(this.width, 0);
    for (let y = 0; y <= this.height; y += 20) {
      const x = this.width - 30 - Math.sin(y * 0.02 + 2) * 15 - Math.sin(y * 0.05 + 1) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawPaths(ctx) {
    for (const p of this.paths) {
      // Path width scales with perspective
      const avgY = (p.y1 + p.y2) / 2;
      const scale = 0.4 + (avgY / this.height) * 0.6;
      const pathWidth = 20 * scale;

      // Path background
      ctx.strokeStyle = 'rgba(90, 65, 40, 0.6)';
      ctx.lineWidth = pathWidth + 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();

      // Path surface
      ctx.strokeStyle = 'rgba(120, 90, 55, 0.5)';
      ctx.lineWidth = pathWidth;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();

      // Grass tufts along edges
      ctx.fillStyle = 'rgba(50, 80, 30, 0.4)';
      const len = Math.sqrt((p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2);
      const steps = Math.floor(len / 20);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const gx = p.x1 + (p.x2 - p.x1) * t;
        const gy = p.y1 + (p.y2 - p.y1) * t;
        const gs = 3 * scale;
        ctx.fillRect(gx - pathWidth / 2 - gs, gy - gs / 2, gs, gs);
        ctx.fillRect(gx + pathWidth / 2, gy - gs / 2, gs, gs);
      }
    }
  }

  drawCliffs(ctx) {
    for (const cliff of this.cliffs) {
      // Dark chasm
      ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
      ctx.fillRect(
        cliff.x - cliff.width / 2,
        cliff.y - cliff.height / 2,
        cliff.width,
        cliff.height
      );

      // Chasm edges
      ctx.strokeStyle = 'rgba(60, 40, 25, 0.6)';
      ctx.lineWidth = 2 * cliff.scale;
      ctx.strokeRect(
        cliff.x - cliff.width / 2,
        cliff.y - cliff.height / 2,
        cliff.width,
        cliff.height
      );
    }
  }

  drawTrees(ctx) {
    // Sort by Y for depth ordering
    const sorted = [...this.trees].sort((a, b) => a.y - b.y);
    for (const tree of sorted) {
      const s = tree.scale;
      if (tree.type === 'dead') {
        // Dead tree
        ctx.strokeStyle = `rgba(80, 60, 40, ${0.4 + s * 0.3})`;
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y);
        ctx.lineTo(tree.x, tree.y - 20 * s);
        ctx.moveTo(tree.x, tree.y - 15 * s);
        ctx.lineTo(tree.x - 8 * s, tree.y - 22 * s);
        ctx.moveTo(tree.x, tree.y - 12 * s);
        ctx.lineTo(tree.x + 6 * s, tree.y - 19 * s);
        ctx.stroke();
      } else {
        // Bush
        ctx.fillStyle = `rgba(40, 70, 30, ${0.3 + s * 0.3})`;
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, 6 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCastle(ctx) {
    const cx = this.width / 2;
    const cy = this.castleY;
    const cw = this.castleWidth;

    // Castle wall
    const wallGrad = ctx.createLinearGradient(cx - cw / 2, cy - 30, cx - cw / 2, cy + 30);
    wallGrad.addColorStop(0, '#8B7355');
    wallGrad.addColorStop(1, '#6B5335');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(cx - cw / 2, cy - 20, cw, 50);

    // Crenellations (battlements)
    ctx.fillStyle = '#7B6345';
    const crenCount = 10;
    const crenWidth = cw / crenCount;
    for (let i = 0; i < crenCount; i += 2) {
      ctx.fillRect(
        cx - cw / 2 + i * crenWidth, cy - 32,
        crenWidth, 14
      );
    }

    // Wall outline
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - cw / 2, cy - 20, cw, 50);

    // Gate (iron portcullis)
    const gateW = 40;
    const gateH = 35;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - gateW / 2, cy - 15, gateW, gateH);
    // Portcullis bars
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const bx = cx - gateW / 2 + 4 + i * 8;
      ctx.beginPath();
      ctx.moveTo(bx, cy - 15);
      ctx.lineTo(bx, cy - 15 + gateH);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const by = cy - 15 + 4 + i * 8;
      ctx.beginPath();
      ctx.moveTo(cx - gateW / 2, by);
      ctx.lineTo(cx + gateW / 2, by);
      ctx.stroke();
    }

    // Torches
    const torchPositions = [cx - cw / 2 + 20, cx + cw / 2 - 20, cx - 60, cx + 60];
    for (const tx of torchPositions) {
      // Torch pole
      ctx.strokeStyle = '#6B4226';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, cy - 20);
      ctx.lineTo(tx, cy - 35);
      ctx.stroke();

      // Flame
      const flicker = Math.sin(Date.now() * 0.01 + tx) * 2;
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(tx, cy - 38 + flicker, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      const glow = ctx.createRadialGradient(tx, cy - 35, 0, tx, cy - 35, 30);
      glow.addColorStop(0, 'rgba(230, 126, 34, 0.15)');
      glow.addColorStop(1, 'rgba(230, 126, 34, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(tx - 30, cy - 65, 60, 60);
    }
  }
}
