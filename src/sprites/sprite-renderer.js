// Pixel Art Sprite Rendering System
// Inspired by pixel-agents: palette-indexed sprites rendered to cached canvases
// with imageSmoothingEnabled=false for crisp pixel-perfect scaling

const spriteCache = new Map();

/**
 * Create a sprite canvas from palette-indexed row data
 * @param {Object} palette - char -> hex color mapping ('.' = transparent)
 * @param {string[]} rows - array of strings, each char = one pixel
 * @returns {HTMLCanvasElement}
 */
export function createSprite(palette, rows) {
    const height = rows.length;
    const width = rows[0].length;
    const key = rows.join('|');

    if (spriteCache.has(key)) return spriteCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const char = rows[y][x];
            if (char === '.' || char === ' ') continue;
            const color = palette[char];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    spriteCache.set(key, canvas);
    return canvas;
}

/**
 * Create an animated sprite set (array of canvases) from frame data
 */
export function createAnimatedSprite(palette, frames) {
    return frames.map(frame => createSprite(palette, frame));
}

/**
 * Draw a sprite at position with pixel-perfect scaling
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} sprite
 * @param {number} x - center x
 * @param {number} y - bottom y (anchor at bottom-center)
 * @param {number} scale - pixel scale multiplier
 * @param {Object} opts - optional: flipX, alpha, rotation
 */
export function drawSprite(ctx, sprite, x, y, scale = 2, opts = {}) {
    if (!sprite) return;
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const drawX = Math.round(x - w / 2);
    const drawY = Math.round(y - h);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

    if (opts.rotation) {
        ctx.translate(Math.round(x), Math.round(y - h / 2));
        ctx.rotate(opts.rotation);
        if (opts.flipX) ctx.scale(-1, 1);
        ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    } else if (opts.flipX) {
        ctx.translate(drawX + w, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0, w, h);
    } else {
        ctx.drawImage(sprite, drawX, drawY, w, h);
    }

    ctx.restore();
}

/**
 * Draw a sprite anchored at top-left
 */
export function drawSpriteAt(ctx, sprite, x, y, scale = 2) {
    if (!sprite) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, Math.round(x), Math.round(y),
                  sprite.width * scale, sprite.height * scale);
    ctx.restore();
}

/**
 * Draw a tiled sprite pattern to fill a region
 */
export function drawTiledSprite(ctx, sprite, x, y, width, height, scale = 2) {
    if (!sprite) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const tw = sprite.width * scale;
    const th = sprite.height * scale;
    for (let ty = y; ty < y + height; ty += th) {
        for (let tx = x; tx < x + width; tx += tw) {
            const dw = Math.min(tw, x + width - tx);
            const dh = Math.min(th, y + height - ty);
            ctx.drawImage(sprite, 0, 0, dw / scale, dh / scale,
                         Math.round(tx), Math.round(ty), dw, dh);
        }
    }
    ctx.restore();
}

/**
 * Create a flipped (horizontal) version of a sprite
 */
export function flipSprite(sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(sprite.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0);
    return canvas;
}

/**
 * Create a recolored version of a sprite
 */
export function recolorSprite(sprite, fromColor, toColor) {
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sprite, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const fr = parseInt(fromColor.slice(1, 3), 16);
    const fg = parseInt(fromColor.slice(3, 5), 16);
    const fb = parseInt(fromColor.slice(5, 7), 16);
    const tr = parseInt(toColor.slice(1, 3), 16);
    const tg = parseInt(toColor.slice(3, 5), 16);
    const tb = parseInt(toColor.slice(5, 7), 16);
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === fr && data[i + 1] === fg && data[i + 2] === fb) {
            data[i] = tr;
            data[i + 1] = tg;
            data[i + 2] = tb;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Get perspective scale factor for Y position (matching game's depth system)
 */
export function perspectiveScale(y, gameHeight = 800) {
    return 0.4 + (y / gameHeight) * 0.6;
}

/**
 * Ensure pixel-perfect rendering on a canvas context
 */
export function setupPixelCanvas(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}
