// ─────────────────────────────────────────────────────
// @termuijs/core — Public API
// ─────────────────────────────────────────────────────

// ── Terminal ──────────────────────────────────────────
export { Terminal } from './terminal/Terminal.js';
export type { TerminalOptions } from './terminal/Terminal.js';
export { Screen, emptyCell, cellsEqual } from './terminal/Screen.js';
export type { Cell } from './terminal/Screen.js';
export { Renderer } from './terminal/Renderer.js';
export { LayerManager } from './terminal/LayerManager.js';
export type { Layer } from './terminal/LayerManager.js';

// ── Input ─────────────────────────────────────────────
export { InputParser } from './input/InputParser.js';
export { ESCAPE_SEQUENCES, CTRL_KEYS, SPECIAL_KEYS } from './input/KeyMap.js';
export { parseMouseEvent, isMouseSequence } from './input/MouseParser.js';

// ── Layout ────────────────────────────────────────────
export { computeLayout, createLayoutNode } from './layout/LayoutEngine.js';
export type { LayoutNode } from './layout/LayoutEngine.js';
export { emptyRect, containsPoint, shrinkRect, intersectRect, unionRect } from './layout/Rect.js';
export type { Rect, Size } from './layout/Rect.js';

// ── Events ────────────────────────────────────────────
export { EventEmitter } from './events/EventEmitter.js';
export { FocusManager } from './events/FocusManager.js';
export type { Focusable } from './events/FocusManager.js';
export type { KeyEvent, MouseEvent, ResizeEvent, FocusEvent, EventMap } from './events/types.js';
export { createKeyEvent } from './events/types.js';

// ── Style ─────────────────────────────────────────────
export { defaultStyle, mergeStyles, normalizeEdges, styleToCellAttrs } from './style/Style.js';
export type { Style, Edges } from './style/Style.js';
export { getBorderChars, borderSize, BORDER_CHARS } from './style/Border.js';
export type { BorderStyle, BorderChars } from './style/Border.js';
export {
    parseColor, colorToRgb, colorToAnsiFg, colorToAnsiBg,
    detectColorDepth, ColorDepth,
} from './style/Color.js';
export type { Color, NamedColor } from './style/Color.js';

// ── App ───────────────────────────────────────────────
export { App } from './app/App.js';
export type { AppOptions, RootWidget } from './app/App.js';
export { shouldUseFallback, renderFallback } from './app/Fallback.js';

// ── Utilities ─────────────────────────────────────────
export { stringWidth, truncate, stripAnsi, wordWrap } from './utils/unicode.js';
export * as ansi from './utils/ansi.js';
