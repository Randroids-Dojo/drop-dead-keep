import { COLORS, DRAG_SCALE, MAX_LAUNCH_SPEED } from '../constants.js';
import { getTrajectoryPoints } from '../physics.js';

export class Catapult {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.aiming = false;
        this.aimVx = 0;
        this.aimVy = 0;
    }

    // Check if pointer is near catapult to start drag
    isNear(px, py, threshold = 40) {
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) < threshold * threshold;
    }

    // Compute launch velocity from drag vector (inverted, like Angry Birds)
    computeLaunch(dragDx, dragDy) {
        let vx = -dragDx * DRAG_SCALE;
        let vy = -dragDy * DRAG_SCALE;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > MAX_LAUNCH_SPEED) {
            const scale = MAX_LAUNCH_SPEED / speed;
            vx *= scale;
            vy *= scale;
        }
        return { vx, vy };
    }

    render(ctx, input) {
        ctx.save();

        // Base platform
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x - 15, this.y + 5, 30, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 15, this.y + 5, 30, 12);

        // Arm (vertical post)
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - 4, this.y - 20, 8, 25);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(this.x - 4, this.y - 20, 8, 25);

        // Bucket/cup at top
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 20);
        ctx.lineTo(this.x - 8, this.y - 12);
        ctx.lineTo(this.x + 8, this.y - 12);
        ctx.lineTo(this.x + 10, this.y - 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Aiming line & trajectory preview
        if (this.aiming && input.down) {
            const drag = input.getDragVector();
            const { vx, vy } = this.computeLaunch(drag.dx, drag.dy);

            // Rubber band / aim line
            ctx.strokeStyle = COLORS.uiAccent;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 16);
            ctx.lineTo(input.x, input.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Trajectory dots
            const points = getTrajectoryPoints(this.x, this.y - 16, vx, vy, 40, 0.025);
            ctx.fillStyle = COLORS.uiAccent;
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                if (p.y > 700) break;
                ctx.globalAlpha = 1 - i / points.length;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }
}
