// ─────────────────────────────────────────────────────
// @termuijs/core — Color types and color profile detection
// ─────────────────────────────────────────────────────

/**
 * Supported color depth levels, ordered from least to most capable.
 */
export enum ColorDepth {
    /** No color support (e.g. NO_COLOR env var set) */
    None = 0,
    /** 4-bit, 16 colors (standard ANSI) */
    Basic = 4,
    /** 8-bit, 256 colors */
    Ansi256 = 8,
    /** 24-bit, 16.7 million colors (true color) */
    TrueColor = 24,
}

/**
 * Represents a color value in the terminal.
 * Supports named ANSI colors, 256-color palette, and RGB true color.
 */
export type Color =
    | { type: 'named'; name: NamedColor }
    | { type: 'ansi256'; code: number }
    | { type: 'rgb'; r: number; g: number; b: number }
    | { type: 'hex'; hex: string }
    | { type: 'none' };

export type NamedColor =
    | 'black' | 'red' | 'green' | 'yellow'
    | 'blue' | 'magenta' | 'cyan' | 'white'
    | 'brightBlack' | 'brightRed' | 'brightGreen' | 'brightYellow'
    | 'brightBlue' | 'brightMagenta' | 'brightCyan' | 'brightWhite';

/** Maps named colors to their ANSI 4-bit foreground code offsets (30-37, 90-97). */
const NAMED_TO_ANSI: Record<NamedColor, number> = {
    black: 0, red: 1, green: 2, yellow: 3,
    blue: 4, magenta: 5, cyan: 6, white: 7,
    brightBlack: 8, brightRed: 9, brightGreen: 10, brightYellow: 11,
    brightBlue: 12, brightMagenta: 13, brightCyan: 14, brightWhite: 15,
};

/** Maps named colors to approximate RGB for downgrading. */
const NAMED_TO_RGB: Record<NamedColor, [number, number, number]> = {
    black: [0, 0, 0], red: [170, 0, 0], green: [0, 170, 0], yellow: [170, 170, 0],
    blue: [0, 0, 170], magenta: [170, 0, 170], cyan: [0, 170, 170], white: [170, 170, 170],
    brightBlack: [85, 85, 85], brightRed: [255, 85, 85], brightGreen: [85, 255, 85], brightYellow: [255, 255, 85],
    brightBlue: [85, 85, 255], brightMagenta: [255, 85, 255], brightCyan: [85, 255, 255], brightWhite: [255, 255, 255],
};

/**
 * Parse a color string into a Color object.
 *
 * Accepts:
 * - Named colors: 'red', 'brightBlue', etc.
 * - Hex: '#ff0000', '#f00'
 * - RGB: 'rgb(255, 0, 0)'
 * - ANSI 256: 'ansi256(196)'
 */
export function parseColor(input: string): Color {
    if (input === 'none' || input === '') {
        return { type: 'none' };
    }

    // Named color
    if (input in NAMED_TO_ANSI) {
        return { type: 'named', name: input as NamedColor };
    }

    // Hex color
    if (input.startsWith('#')) {
        let hex = input.slice(1);
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length === 6 && /^[0-9a-fA-F]{6}$/.test(hex)) {
            return { type: 'hex', hex: '#' + hex.toLowerCase() };
        }
        throw new Error(`Invalid hex color: ${input}`);
    }

    // RGB color
    const rgbMatch = input.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
    if (rgbMatch) {
        const r = Math.min(255, parseInt(rgbMatch[1], 10));
        const g = Math.min(255, parseInt(rgbMatch[2], 10));
        const b = Math.min(255, parseInt(rgbMatch[3], 10));
        return { type: 'rgb', r, g, b };
    }

    // ANSI 256
    const ansi256Match = input.match(/^ansi256\(\s*(\d{1,3})\s*\)$/);
    if (ansi256Match) {
        const code = Math.min(255, parseInt(ansi256Match[1], 10));
        return { type: 'ansi256', code };
    }

    throw new Error(`Unknown color format: ${input}`);
}

/**
 * Convert any Color to its RGB representation.
 */
export function colorToRgb(color: Color): [number, number, number] {
    switch (color.type) {
        case 'none':
            return [0, 0, 0];
        case 'named':
            return NAMED_TO_RGB[color.name];
        case 'rgb':
            return [color.r, color.g, color.b];
        case 'hex': {
            const hex = color.hex.slice(1);
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
            ];
        }
        case 'ansi256':
            return ansi256ToRgb(color.code);
    }
}

/**
 * Convert an ANSI 256 code to approximate RGB.
 */
function ansi256ToRgb(code: number): [number, number, number] {
    // Standard colors (0-15) — use named mapping
    if (code < 16) {
        const names = Object.keys(NAMED_TO_RGB) as NamedColor[];
        return NAMED_TO_RGB[names[code]];
    }
    // Extended 216-color cube (16-231)
    if (code < 232) {
        const idx = code - 16;
        const b = (idx % 6) * 51;
        const g = (Math.floor(idx / 6) % 6) * 51;
        const r = Math.floor(idx / 36) * 51;
        return [r, g, b];
    }
    // Grayscale ramp (232-255)
    const gray = (code - 232) * 10 + 8;
    return [gray, gray, gray];
}

/**
 * Find the nearest ANSI 256 color code for a given RGB.
 */
function rgbToAnsi256(r: number, g: number, b: number): number {
    // Check if it's a grayscale
    if (r === g && g === b) {
        if (r < 8) return 16;
        if (r > 248) return 231;
        return Math.round((r - 8) / 247 * 24) + 232;
    }
    return 16
        + 36 * Math.round(r / 255 * 5)
        + 6 * Math.round(g / 255 * 5)
        + Math.round(b / 255 * 5);
}

/**
 * Find the nearest ANSI 4-bit basic color for a given RGB.
 */
function rgbToBasic(r: number, g: number, b: number): number {
    let minDist = Infinity;
    let best = 0;
    const names = Object.keys(NAMED_TO_RGB) as NamedColor[];
    for (let i = 0; i < names.length; i++) {
        const [cr, cg, cb] = NAMED_TO_RGB[names[i]];
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
        if (dist < minDist) {
            minDist = dist;
            best = i;
        }
    }
    return best;
}

/**
 * Detect the terminal's color depth from environment variables.
 */
export function detectColorDepth(): ColorDepth {
    const env = process.env;

    // Respect NO_COLOR convention (https://no-color.org/)
    if (env['NO_COLOR'] !== undefined) {
        return ColorDepth.None;
    }

    // Force color via FORCE_COLOR
    if (env['FORCE_COLOR'] !== undefined) {
        const level = parseInt(env['FORCE_COLOR'], 10);
        if (level === 0) return ColorDepth.None;
        if (level === 1) return ColorDepth.Basic;
        if (level === 2) return ColorDepth.Ansi256;
        if (level >= 3) return ColorDepth.TrueColor;
    }

    // Check COLORTERM for true color
    const colorterm = env['COLORTERM'];
    if (colorterm === 'truecolor' || colorterm === '24bit') {
        return ColorDepth.TrueColor;
    }

    // Check TERM for 256 color
    const term = env['TERM'] || '';
    if (term === 'dumb') {
        return ColorDepth.None;
    }
    if (term.includes('256color') || term.includes('256')) {
        return ColorDepth.Ansi256;
    }

    // Check for common color-capable terminals
    if (env['TERM_PROGRAM'] === 'iTerm.app' || env['TERM_PROGRAM'] === 'Hyper') {
        return ColorDepth.TrueColor;
    }

    // Default to basic if stdout is a TTY
    if (process.stdout?.isTTY) {
        return ColorDepth.Basic;
    }

    return ColorDepth.None;
}

/**
 * Generate the ANSI escape codes for a foreground color at the given depth.
 */
export function colorToAnsiFg(color: Color, depth: ColorDepth): string {
    if (color.type === 'none' || depth === ColorDepth.None) return '';
    const [r, g, b] = colorToRgb(color);

    switch (depth) {
        case ColorDepth.TrueColor:
            return `\x1b[38;2;${r};${g};${b}m`;
        case ColorDepth.Ansi256:
            return `\x1b[38;5;${rgbToAnsi256(r, g, b)}m`;
        case ColorDepth.Basic: {
            const idx = rgbToBasic(r, g, b);
            return idx < 8 ? `\x1b[${30 + idx}m` : `\x1b[${90 + idx - 8}m`;
        }
        default:
            return '';
    }
}

/**
 * Generate the ANSI escape codes for a background color at the given depth.
 */
export function colorToAnsiBg(color: Color, depth: ColorDepth): string {
    if (color.type === 'none' || depth === ColorDepth.None) return '';
    const [r, g, b] = colorToRgb(color);

    switch (depth) {
        case ColorDepth.TrueColor:
            return `\x1b[48;2;${r};${g};${b}m`;
        case ColorDepth.Ansi256:
            return `\x1b[48;5;${rgbToAnsi256(r, g, b)}m`;
        case ColorDepth.Basic: {
            const idx = rgbToBasic(r, g, b);
            return idx < 8 ? `\x1b[${40 + idx}m` : `\x1b[${100 + idx - 8}m`;
        }
        default:
            return '';
    }
}
