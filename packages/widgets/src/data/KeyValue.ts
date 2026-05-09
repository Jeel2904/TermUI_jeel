// ─────────────────────────────────────────────────────
// @termuijs/widgets — KeyValue widget
// ─────────────────────────────────────────────────────

import { type Screen, type Style, styleToCellAttrs, stringWidth } from '@termuijs/core';
import { Widget } from '../base/Widget.js';

export interface KeyValuePair {
    key: string;
    value: string;
}

export interface KeyValueOptions {
    /** Separator between key and value (default: ': ') */
    separator?: string;
    /** Color for keys */
    keyColor?: import('@termuijs/core').Color;
    /** Color for values */
    valueColor?: import('@termuijs/core').Color;
}

/**
 * KeyValue — aligned key: value pairs.
 *
 * Keys are right-aligned to the width of the longest key.
 * Values follow after the separator.
 */
export class KeyValue extends Widget {
    private _pairs: KeyValuePair[];
    private _separator: string;
    private _keyColor?: import('@termuijs/core').Color;
    private _valueColor?: import('@termuijs/core').Color;

    constructor(
        pairs: Array<KeyValuePair> | Record<string, string>,
        style: Partial<Style> = {},
        opts: KeyValueOptions = {},
    ) {
        super(style);
        this._pairs = Array.isArray(pairs)
            ? pairs
            : Object.entries(pairs).map(([key, value]) => ({ key, value }));
        this._separator = opts.separator ?? ': ';
        this._keyColor = opts.keyColor;
        this._valueColor = opts.valueColor;
    }

    setPairs(pairs: Array<KeyValuePair> | Record<string, string>): void {
        this._pairs = Array.isArray(pairs)
            ? pairs
            : Object.entries(pairs).map(([key, value]) => ({ key, value }));
        this.markDirty();
    }

    protected _renderSelf(screen: Screen): void {
        const rect = this._getContentRect();
        const { x, y, width, height } = rect;
        if (width <= 0 || height <= 0 || this._pairs.length === 0) return;

        const attrs = styleToCellAttrs(this._style);

        // Find max key width for alignment
        let maxKeyWidth = 0;
        for (const pair of this._pairs) {
            const w = stringWidth(pair.key);
            if (w > maxKeyWidth) maxKeyWidth = w;
        }

        const sepWidth = stringWidth(this._separator);

        for (let i = 0; i < this._pairs.length && i < height; i++) {
            const pair = this._pairs[i];
            if (!pair) continue;

            const keyWidth = stringWidth(pair.key);
            const keyX = x + (maxKeyWidth - keyWidth); // right-align key
            const sepX = x + maxKeyWidth;
            const valX = sepX + sepWidth;
            const valWidth = Math.max(0, width - maxKeyWidth - sepWidth);

            // Key
            screen.writeString(keyX, y + i, pair.key, {
                ...attrs,
                fg: this._keyColor ?? attrs.fg,
                bold: true,
            });

            // Separator
            screen.writeString(sepX, y + i, this._separator, { ...attrs, dim: true });

            // Value
            if (valWidth > 0) {
                screen.writeString(valX, y + i, pair.value.slice(0, valWidth), {
                    ...attrs,
                    fg: this._valueColor ?? attrs.fg,
                });
            }
        }
    }
}
