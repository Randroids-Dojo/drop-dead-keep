// Drop Dead Keep — Wave Spawning & Management

import { Zombie, ZombieType } from '../entities/zombie.js';

export class WaveSystem {
  constructor() {
    this.waves = [];
    this.currentWave = 0;
    this.zombies = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.waveActive = false;
    this.waveComplete = false;
    this.allWavesComplete = false;
    this.intermissionTimer = 0;
    this.intermissionDuration = 5;
    this.inIntermission = false;

    // Stats
    this.zombiesKilled = 0;
    this.zombiesBreached = 0;

    // Gate
    this.gateMaxHp = 100;
    this.gateHp = 100;
    this.gateDamagePerZombie = {
      shambler: 5,
      sprinter: 5,
      plank_carrier: 5,
      engineer: 5,
      brute: 20,
    };
  }

  loadWaves(waveData, gateHp) {
    this.waves = waveData;
    this.currentWave = 0;
    this.zombies = [];
    this.spawnQueue = [];
    this.waveActive = false;
    this.waveComplete = false;
    this.allWavesComplete = false;
    this.zombiesKilled = 0;
    this.zombiesBreached = 0;
    this.gateMaxHp = gateHp || 100;
    this.gateHp = this.gateMaxHp;
  }

  startWave(spawnPoint, waypoints) {
    if (this.currentWave >= this.waves.length) {
      this.allWavesComplete = true;
      return false;
    }

    const wave = this.waves[this.currentWave];
    this.spawnQueue = [];
    this.waveActive = true;
    this.waveComplete = false;
    this.inIntermission = false;

    this.spawnInterval = wave.spawnInterval || 1.0;

    // Build spawn queue
    for (const group of wave.groups) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: (group.startDelay || 0) + i * (group.stagger || this.spawnInterval),
          spawnPoint: { ...spawnPoint },
          waypoints: waypoints.map(wp => ({ ...wp })),
        });
      }
    }

    // Sort by delay
    this.spawnQueue.sort((a, b) => a.delay - b.delay);

    this.spawnTimer = 0;
    return true;
  }

  update(dt, bridges) {
    if (this.inIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.inIntermission = false;
      }
      return;
    }

    if (!this.waveActive) return;

    this.spawnTimer += dt;

    // Spawn zombies from queue
    while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
      const spawn = this.spawnQueue.shift();
      const zombie = new Zombie(spawn.type, spawn.spawnPoint.x, spawn.spawnPoint.y);

      // Add small random offset to spawn position
      zombie.x += (Math.random() - 0.5) * 20;

      zombie.setPath(spawn.waypoints);
      this.zombies.push(zombie);
    }

    // Update all zombies
    for (const zombie of this.zombies) {
      zombie.update(dt, bridges);

      // Check gate breach
      if (zombie.reachedGate && zombie.alive) {
        zombie.alive = false;
        this.zombiesBreached++;
        const dmg = this.gateDamagePerZombie[zombie.type] || 5;
        this.gateHp = Math.max(0, this.gateHp - dmg);
      }
    }

    // Track kills (count dead non-falling zombies before removal)
    const deadThisFrame = this.zombies.filter(z => !z.alive && !z.falling);
    this.zombiesKilled += deadThisFrame.length;

    // Remove dead zombies that have finished their animations
    this.zombies = this.zombies.filter(z => z.alive || z.falling);

    // Check wave completion (no alive/falling zombies and no more to spawn)
    if (this.spawnQueue.length === 0 && this.zombies.length === 0) {
      this.waveActive = false;
      this.waveComplete = true;
      this.currentWave++;

      if (this.currentWave >= this.waves.length) {
        this.allWavesComplete = true;
      } else {
        this.inIntermission = true;
        this.intermissionTimer = this.intermissionDuration;
      }
    }
  }

  getGateHpPercent() {
    return this.gateHp / this.gateMaxHp;
  }

  isGameOver() {
    return this.gateHp <= 0;
  }

  isLevelComplete() {
    return this.allWavesComplete && this.zombies.filter(z => z.alive).length === 0;
  }

  getCurrentWaveNumber() {
    return this.currentWave + 1;
  }

  getTotalWaves() {
    return this.waves.length;
  }

  isFinalWave() {
    return this.currentWave === this.waves.length - 1;
  }

  getAliveZombies() {
    return this.zombies.filter(z => z.alive && !z.falling);
  }

  damageZombiesInRadius(x, y, radius, damage) {
    let kills = 0;
    for (const zombie of this.zombies) {
      if (!zombie.alive || zombie.falling) continue;
      if (zombie.isInRadius(x, y, radius)) {
        zombie.takeDamage(damage);
        if (!zombie.alive) kills++;
      }
    }
    return kills;
  }
}
