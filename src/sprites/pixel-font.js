// Bitmap Pixel Font System
// 5x7 pixel font for retro text rendering

const CHAR_WIDTH = 5;
const CHAR_HEIGHT = 7;
const CHAR_SPACING = 1;
const LINE_SPACING = 2;

// Each character defined as 7 rows of 5-bit binary patterns
const FONT_DATA = {
    'A': [0x04,0x0A,0x11,0x1F,0x11,0x11,0x11],
    'B': [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
    'C': [0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
    'D': [0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
    'E': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
    'F': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
    'G': [0x0E,0x11,0x10,0x17,0x11,0x11,0x0E],
    'H': [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
    'I': [0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
    'J': [0x07,0x02,0x02,0x02,0x02,0x12,0x0C],
    'K': [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
    'L': [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
    'M': [0x11,0x1B,0x15,0x15,0x11,0x11,0x11],
    'N': [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
    'O': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
    'P': [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
    'Q': [0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
    'R': [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
    'S': [0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],
    'T': [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
    'U': [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
    'V': [0x11,0x11,0x11,0x11,0x0A,0x0A,0x04],
    'W': [0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
    'X': [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
    'Y': [0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
    'Z': [0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
    '0': [0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
    '1': [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
    '2': [0x0E,0x11,0x01,0x06,0x08,0x10,0x1F],
    '3': [0x0E,0x11,0x01,0x06,0x01,0x11,0x0E],
    '4': [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
    '5': [0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
    '6': [0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
    '7': [0x1F,0x01,0x02,0x04,0x04,0x04,0x04],
    '8': [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
    '9': [0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
    ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    ':': [0x00,0x04,0x04,0x00,0x04,0x04,0x00],
    '.': [0x00,0x00,0x00,0x00,0x00,0x04,0x04],
    ',': [0x00,0x00,0x00,0x00,0x04,0x04,0x08],
    '!': [0x04,0x04,0x04,0x04,0x04,0x00,0x04],
    '?': [0x0E,0x11,0x01,0x06,0x04,0x00,0x04],
    '-': [0x00,0x00,0x00,0x1F,0x00,0x00,0x00],
    '+': [0x00,0x04,0x04,0x1F,0x04,0x04,0x00],
    '/': [0x01,0x01,0x02,0x04,0x08,0x10,0x10],
    '%': [0x18,0x19,0x02,0x04,0x08,0x13,0x03],
    '(': [0x02,0x04,0x08,0x08,0x08,0x04,0x02],
    ')': [0x08,0x04,0x02,0x02,0x02,0x04,0x08],
    '\'': [0x04,0x04,0x08,0x00,0x00,0x00,0x00],
    '"': [0x0A,0x0A,0x14,0x00,0x00,0x00,0x00],
    '*': [0x00,0x04,0x15,0x0E,0x15,0x04,0x00],
    '#': [0x0A,0x1F,0x0A,0x0A,0x1F,0x0A,0x00],
    'x': [0x00,0x00,0x11,0x0A,0x04,0x0A,0x11],
};

// Pre-rendered font cache: Map<color+size, Map<char, canvas>>
const fontCache = new Map();

function getCharCanvas(char, color, pixelSize) {
    const key = `${color}_${pixelSize}`;
    if (!fontCache.has(key)) fontCache.set(key, new Map());
    const sizeCache = fontCache.get(key);
    if (sizeCache.has(char)) return sizeCache.get(char);

    const data = FONT_DATA[char.toUpperCase()];
    if (!data) return null;

    const canvas = document.createElement('canvas');
    canvas.width = CHAR_WIDTH * pixelSize;
    canvas.height = CHAR_HEIGHT * pixelSize;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;

    for (let row = 0; row < CHAR_HEIGHT; row++) {
        for (let col = 0; col < CHAR_WIDTH; col++) {
            if (data[row] & (0x10 >> col)) {
                ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    sizeCache.set(char, canvas);
    return canvas;
}

/**
 * Draw pixel text on canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {Object} opts - color, size (pixel scale), align ('left'|'center'|'right'), shadow
 */
export function drawPixelText(ctx, text, x, y, opts = {}) {
    const color = opts.color || '#ffffff';
    const size = opts.size || 2;
    const align = opts.align || 'left';
    const shadow = opts.shadow || null;
    const shadowOffset = opts.shadowOffset || 1;

    const lines = text.toString().split('\n');
    const lineHeight = (CHAR_HEIGHT + LINE_SPACING) * size;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        const totalWidth = line.length * (CHAR_WIDTH + CHAR_SPACING) * size - CHAR_SPACING * size;

        let startX = x;
        if (align === 'center') startX = x - totalWidth / 2;
        else if (align === 'right') startX = x - totalWidth;

        const lineY = y + l * lineHeight;

        for (let i = 0; i < line.length; i++) {
            const charX = Math.round(startX + i * (CHAR_WIDTH + CHAR_SPACING) * size);
            const charY = Math.round(lineY);

            // Draw shadow first
            if (shadow) {
                const shadowCanvas = getCharCanvas(line[i], shadow, size);
                if (shadowCanvas) {
                    ctx.drawImage(shadowCanvas, charX + shadowOffset * size, charY + shadowOffset * size);
                }
            }

            // Draw character
            const charCanvas = getCharCanvas(line[i], color, size);
            if (charCanvas) {
                ctx.drawImage(charCanvas, charX, charY);
            }
        }
    }

    ctx.restore();
}

/**
 * Measure pixel text width
 */
export function measurePixelText(text, size = 2) {
    return text.length * (CHAR_WIDTH + CHAR_SPACING) * size - CHAR_SPACING * size;
}

/**
 * Get pixel text line height
 */
export function pixelTextHeight(size = 2) {
    return CHAR_HEIGHT * size;
}

/**
 * Draw a pixel-art bordered box (for UI panels)
 */
export function drawPixelBox(ctx, x, y, width, height, opts = {}) {
    const bgColor = opts.bg || '#1a1a1a';
    const borderColor = opts.border || '#e67e22';
    const borderWidth = opts.borderWidth || 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));

    // Pixel-perfect border (no anti-aliasing)
    ctx.fillStyle = borderColor;
    // Top
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), borderWidth);
    // Bottom
    ctx.fillRect(Math.round(x), Math.round(y + height - borderWidth), Math.round(width), borderWidth);
    // Left
    ctx.fillRect(Math.round(x), Math.round(y), borderWidth, Math.round(height));
    // Right
    ctx.fillRect(Math.round(x + width - borderWidth), Math.round(y), borderWidth, Math.round(height));
}

/**
 * Draw a pixel-art button
 */
export function drawPixelButton(ctx, x, y, width, height, text, opts = {}) {
    const bgColor = opts.bg || '#e67e22';
    const hoverBg = opts.hoverBg || '#cc6600';
    const isHover = opts.hover || false;
    const textColor = opts.textColor || '#ffffff';
    const textSize = opts.textSize || 2;

    const bg = isHover ? hoverBg : bgColor;

    // Button body
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), Math.round(width), Math.round(height));

    ctx.fillStyle = bg;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));

    // Border
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), 2);
    ctx.fillRect(Math.round(x), Math.round(y + height - 2), Math.round(width), 2);
    ctx.fillRect(Math.round(x), Math.round(y), 2, Math.round(height));
    ctx.fillRect(Math.round(x + width - 2), Math.round(y), 2, Math.round(height));

    // Highlight edge (top-left)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), Math.round(width - 4), 2);
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), 2, Math.round(height - 4));

    // Text centered
    drawPixelText(ctx, text, Math.round(x + width / 2), Math.round(y + (height - CHAR_HEIGHT * textSize) / 2), {
        color: textColor,
        size: textSize,
        align: 'center',
        shadow: '#1a1a1a',
    });
}

/**
 * Draw a pixel-art health/progress bar
 */
export function drawPixelBar(ctx, x, y, width, height, value, maxValue, opts = {}) {
    const bgColor = opts.bg || '#333333';
    const borderColor = opts.border || '#1a1a1a';

    // Determine fill color based on percentage
    const pct = value / maxValue;
    let fillColor;
    if (opts.fillColor) {
        fillColor = opts.fillColor;
    } else if (pct > 0.6) {
        fillColor = '#4CAF50';
    } else if (pct > 0.3) {
        fillColor = '#f1c40f';
    } else {
        fillColor = '#cc3333';
    }

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));

    // Fill
    ctx.fillStyle = fillColor;
    const fillWidth = Math.round(width * Math.max(0, Math.min(1, pct)));
    ctx.fillRect(Math.round(x), Math.round(y), fillWidth, Math.round(height));

    // Border
    ctx.fillStyle = borderColor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), 2);
    ctx.fillRect(Math.round(x), Math.round(y + height - 2), Math.round(width), 2);
    ctx.fillRect(Math.round(x), Math.round(y), 2, Math.round(height));
    ctx.fillRect(Math.round(x + width - 2), Math.round(y), 2, Math.round(height));
}
