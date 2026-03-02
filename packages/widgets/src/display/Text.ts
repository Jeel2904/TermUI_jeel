// ─────────────────────────────────────────────────────
// @termuijs/widgets — Text widget
// ─────────────────────────────────────────────────────

import { type Screen, type Style, styleToCellAttrs, wordWrap, stringWidth } from '@termuijs/core';
import { Widget } from '../base/Widget.js';

export interface TextProps {
    content: string;
    wrap?: boolean;
    align?: 'left' | 'center' | 'right';
}

/**
 * Text — renders a string of text with word-wrapping and alignment.
 */
export class Text extends Widget {
    private _content: string;
    private _wrap: boolean;
    private _align: 'left' | 'center' | 'right';

    constructor(content: string, style: Partial<Style> = {}, props: Partial<TextProps> = {}) {
        super(style);
        this._content = content;
        this._wrap = props.wrap ?? true;
        this._align = props.align ?? 'left';
    }

    /** Update the text content */
    setContent(content: string): void {
        this._content = content;
    }

    /** Get current text content */
    getContent(): string {
        return this._content;
    }

    protected _renderSelf(screen: Screen): void {
        const contentRect = this._getContentRect();
        const { x, y, width, height } = contentRect;
        if (width <= 0 || height <= 0) return;

        const attrs = styleToCellAttrs(this._style);

        // Word-wrap if enabled
        let text = this._wrap ? wordWrap(this._content, width) : this._content;
        const lines = text.split('\n');

        for (let i = 0; i < Math.min(lines.length, height); i++) {
            let line = lines[i];
            const lineWidth = stringWidth(line);

            // Apply alignment
            let offsetX = 0;
            if (this._align === 'center') {
                offsetX = Math.floor((width - lineWidth) / 2);
            } else if (this._align === 'right') {
                offsetX = width - lineWidth;
            }

            screen.writeString(x + Math.max(0, offsetX), y + i, line, attrs);
        }
    }
}
