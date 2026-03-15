import { ENEMY_TYPES, COLORS } from '../constants.js';

export class Zombie {
    constructor(type, waypoints) {
        this.type = type;
        this.config = ENEMY_TYPES[type];
        this.hp = this.config.hp;
        this.speed = 20 + this.config.spd * 12; // pixels/sec
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        this.waypoints = waypoints;
        this.waypointIndex = 0;
        this.alive = true;
        this.reachedEnd = false;
        this.falling = false;
        this.fallVy = 0;
        this.frozen = false;
        this.frozenTimer = 0;
        this.radius = 10;
        this.bobTimer = Math.random() * Math.PI * 2;

        // Engineer-specific
        this.rebuilding = false;
        this.targetBridge = null;
    }

    update(dt, bridges) {
        if (!this.alive) return;

        this.bobTimer += dt * 4;

        // Frozen
        if (this.frozen) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) this.frozen = false;
            return;
        }

        // Falling off bridge
        if (this.falling) {
            this.fallVy += 400 * dt;
            this.y += this.fallVy * dt;
            if (this.y > 700) this.alive = false;
            return;
        }

        // Engineer rebuild logic
        if (this.type === 'engineer' && this.targetBridge && !this.targetBridge.passable) {
            if (!this.rebuilding) {
                this.targetBridge.startRebuild();
                this.rebuilding = true;
            }
            const done = this.targetBridge.updateRebuild(dt);
            if (done) {
                this.rebuilding = false;
                this.targetBridge = null;
            }
            return;
        }

        // Move along waypoints
        if (this.waypointIndex >= this.waypoints.length - 1) {
            this.reachedEnd = true;
            return;
        }

        const target = this.waypoints[this.waypointIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
            this.waypointIndex++;

            // Check if at a bridge that's destroyed
            if (target.bridgeIndex !== undefined && bridges[target.bridgeIndex]) {
                const bridge = bridges[target.bridgeIndex];
                if (!bridge.passable) {
                    if (this.type === 'engineer') {
                        this.targetBridge = bridge;
                    } else if (this.type === 'sprinter' && Math.random() > 0.5) {
                        // Sprinters can sometimes leap gaps
                    } else {
                        this.falling = true;
                        this.fallVy = -50;
                    }
                }
            }
        } else {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;
            this.x += moveX;
            this.y += moveY;
        }
    }

    takeDamage(amount) {
        const effectiveAmt = Math.max(1, amount - this.config.arm * 0.5);
        this.hp -= effectiveAmt;
        if (this.hp <= 0) {
            this.alive = false;
        }
        // Cancel engineer rebuild
        if (this.rebuilding && this.targetBridge) {
            this.targetBridge.cancelRebuild();
            this.rebuilding = false;
        }
    }

    freeze(duration) {
        this.frozen = true;
        this.frozenTimer = duration;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const bob = Math.sin(this.bobTimer) * 2;

        // Frozen overlay
        if (this.frozen) {
            ctx.globalAlpha = 0.7;
        }

        // Body
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        // Torso
        ctx.beginPath();
        ctx.ellipse(0, bob - 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, bob - 16, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-3, bob - 17, 3, 0, Math.PI * 2);
        ctx.arc(3, bob - 17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-2.5, bob - 16.5, 1.5, 0, Math.PI * 2);
        ctx.arc(3.5, bob - 16.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Arms (reaching forward)
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-6, bob - 4);
        ctx.lineTo(-14, bob - 8);
        ctx.moveTo(6, bob - 4);
        ctx.lineTo(14, bob - 8);
        ctx.stroke();

        // Type-specific decoration
        if (this.type === 'engineer') {
            // Hard hat
            ctx.fillStyle = COLORS.engineerHat;
            ctx.fillRect(-7, bob - 24, 14, 5);
            ctx.fillRect(-9, bob - 20, 18, 3);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(-9, bob - 20, 18, 3);
        } else if (this.type === 'brute') {
            // Armor vest
            ctx.fillStyle = COLORS.bruteArmor;
            ctx.fillRect(-7, bob - 8, 14, 12);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(-7, bob - 8, 14, 12);
        } else if (this.type === 'screecher') {
            // Mouth open
            ctx.fillStyle = '#300020';
            ctx.beginPath();
            ctx.arc(0, bob - 13, 4, 0, Math.PI);
            ctx.fill();
        }

        // Frozen ice overlay
        if (this.frozen) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = COLORS.ice;
            ctx.beginPath();
            ctx.ellipse(0, bob - 8, 12, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}
