// Drop Dead Keep — Scoring System

export class ScoringSystem {
  constructor() {
    this.score = 0;
    this.popups = [];
    this.combos = 0;
    this.lastKillTime = 0;
    this.comboWindow = 1.5; // seconds
  }

  reset() {
    this.score = 0;
    this.popups = [];
    this.combos = 0;
    this.lastKillTime = 0;
  }

  addScore(points, x, y, label) {
    this.score += points;
    this.popups.push({
      text: `+${points}${label ? ' ' + label : ''}`,
      x, y,
      age: 0,
      lifetime: 1.5,
      color: points >= 200 ? '#f1c40f' : '#fff',
    });
  }

  onZombieKilledByFalling(x, y) {
    this.addScore(100, x, y, 'FALL');
    this.checkCombo(x, y);
  }

  onZombieKilledByProjectile(x, y) {
    this.addScore(50, x, y, 'HIT');
    this.checkCombo(x, y);
  }

  onZombieKilledByDebris(x, y) {
    this.addScore(150, x, y, 'DEBRIS');
    this.checkCombo(x, y);
  }

  onBridgeDestroyed(x, y) {
    this.addScore(200, x, y, 'BRIDGE DESTROYED');
  }

  onMultiKill(count, x, y) {
    if (count >= 3) {
      this.addScore(300, x, y - 20, `MULTI-KILL x${count}!`);
    }
  }

  onBuilderKilledWhileBuilding(x, y) {
    this.addScore(200, x, y, 'BUILDER DOWN');
  }

  onWaveCleared(noBreaches) {
    if (noBreaches) {
      this.score += 500;
      this.popups.push({
        text: '+500 PERFECT WAVE!',
        x: 400, y: 300,
        age: 0, lifetime: 2,
        color: '#f1c40f',
      });
    }
  }

  onLevelCleared(noBreaches) {
    if (noBreaches) {
      this.score += 1000;
    }
  }

  checkCombo(x, y) {
    const now = Date.now() / 1000;
    if (now - this.lastKillTime < this.comboWindow) {
      this.combos++;
      if (this.combos >= 2) {
        this.addScore(this.combos * 25, x, y - 30, `COMBO x${this.combos}`);
      }
    } else {
      this.combos = 0;
    }
    this.lastKillTime = now;
  }

  getStarRating(breachCount) {
    if (breachCount === 0) return 3;
    if (breachCount <= 2) return 2;
    return 1;
  }

  update(dt) {
    for (const popup of this.popups) {
      popup.age += dt;
      popup.y -= 30 * dt;
    }
    this.popups = this.popups.filter(p => p.age < p.lifetime);
  }

  draw(ctx) {
    for (const popup of this.popups) {
      const alpha = 1 - popup.age / popup.lifetime;
      ctx.fillStyle = popup.color;
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.globalAlpha = 1;
  }
}
