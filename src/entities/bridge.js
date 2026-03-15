import { BRIDGE_STATES, BRIDGE_HP, COLORS, ENGINEER_REBUILD_TIME } from '../constants.js';

export class Bridge {
    constructor(x, y, width, height, material = 'wood') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.material = material;
        this.maxHp = BRIDGE_HP[material];
        this.hp = this.maxHp;
        this.state = BRIDGE_STATES.INTACT;
        this.rebuildProgress = 0; // 0-1
        this.rebuilding = false;
    }

    get passable() {
        return this.state !== BRIDGE_STATES.DESTROYED;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this._updateState();
    }

    _updateState() {
        if (this.hp <= 0) {
            this.state = BRIDGE_STATES.DESTROYED;
        } else if (this.hp <= this.maxHp * 0.5) {
            this.state = BRIDGE_STATES.DAMAGED;
        } else {
            this.state = BRIDGE_STATES.INTACT;
        }
    }

    startRebuild() {
        if (this.state === BRIDGE_STATES.DESTROYED) {
            this.rebuilding = true;
            this.rebuildProgress = 0;
        }
    }

    updateRebuild(dt) {
        if (!this.rebuilding) return false;
        this.rebuildProgress += dt / ENGINEER_REBUILD_TIME;
        if (this.rebuildProgress >= 1) {
            this.rebuildProgress = 0;
            this.rebuilding = false;
            this.hp = this.maxHp;
            this.state = BRIDGE_STATES.INTACT;
            return true; // rebuild complete
        }
        return false;
    }

    cancelRebuild() {
        this.rebuilding = false;
        this.rebuildProgress = 0;
    }

    render(ctx) {
        ctx.save();

        if (this.state === BRIDGE_STATES.INTACT) {
            this._drawIntact(ctx);
        } else if (this.state === BRIDGE_STATES.DAMAGED) {
            this._drawDamaged(ctx);
        } else {
            this._drawDestroyed(ctx);
        }

        // Rebuild progress bar
        if (this.rebuilding) {
            const barW = this.width * 0.8;
            const barH = 6;
            const bx = this.x + (this.width - barW) / 2;
            const by = this.y - 12;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = COLORS.uiAccent;
            ctx.fillRect(bx, by, barW * this.rebuildProgress, barH);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, barW, barH);
        }

        ctx.restore();
    }

    _drawIntact(ctx) {
        // Main plank
        ctx.fillStyle = COLORS.bridgeWood;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Plank lines
        ctx.strokeStyle = '#6b5010';
        ctx.lineWidth = 1;
        const plankCount = Math.floor(this.width / 12);
        for (let i = 1; i < plankCount; i++) {
            const px = this.x + (this.width / plankCount) * i;
            ctx.beginPath();
            ctx.moveTo(px, this.y);
            ctx.lineTo(px, this.y + this.height);
            ctx.stroke();
        }

        // Rope/railing
        ctx.strokeStyle = COLORS.bridgeRope;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 2);
        ctx.lineTo(this.x + this.width, this.y - 2);
        ctx.stroke();

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    _drawDamaged(ctx) {
        // Broken plank with gaps
        ctx.fillStyle = COLORS.bridgeDamaged;
        const segW = this.width / 3;

        // Left segment (tilted)
        ctx.save();
        ctx.translate(this.x + segW * 0.5, this.y + this.height / 2);
        ctx.rotate(-0.1);
        ctx.fillRect(-segW * 0.5, -this.height / 2, segW * 0.9, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-segW * 0.5, -this.height / 2, segW * 0.9, this.height);
        ctx.restore();

        // Right segment (tilted other way)
        ctx.save();
        ctx.translate(this.x + this.width - segW * 0.5, this.y + this.height / 2);
        ctx.rotate(0.15);
        ctx.fillRect(-segW * 0.5, -this.height / 2, segW * 0.9, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-segW * 0.5, -this.height / 2, segW * 0.9, this.height);
        ctx.restore();

        // Middle segment (sagging)
        ctx.fillStyle = COLORS.bridgeDamaged;
        ctx.fillRect(this.x + segW, this.y + 3, segW, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + segW, this.y + 3, segW, this.height);
    }

    _drawDestroyed(ctx) {
        // Just broken stubs on each side
        const stubW = 12;
        ctx.fillStyle = COLORS.bridgeDamaged;

        // Left stub
        ctx.save();
        ctx.translate(this.x + stubW / 2, this.y + this.height / 2);
        ctx.rotate(-0.3);
        ctx.fillRect(-stubW / 2, -this.height / 2, stubW, this.height * 1.2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-stubW / 2, -this.height / 2, stubW, this.height * 1.2);
        ctx.restore();

        // Right stub
        ctx.save();
        ctx.translate(this.x + this.width - stubW / 2, this.y + this.height / 2);
        ctx.rotate(0.25);
        ctx.fillRect(-stubW / 2, -this.height / 2, stubW, this.height * 1.2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-stubW / 2, -this.height / 2, stubW, this.height * 1.2);
        ctx.restore();
    }
}
