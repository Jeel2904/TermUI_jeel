// ─────────────────────────────────────────────────────
// @termuijs/quick — Public API
// ─────────────────────────────────────────────────────

// ── Builder ───────────────────────────────────────────
export { app, AppBuilder } from './app.js';

// ── Layout ────────────────────────────────────────────
export { row, col, grid, toWidget } from './layout.js';
export type { LayoutChild } from './layout.js';

// ── Widget Shorthands ─────────────────────────────────
export {
    text,
    gauge,
    table,
    list,
    input,
    sparkline,
    status,
    logView,
} from './widgets.js';

export type {
    QuickTextOptions,
    QuickGaugeOptions,
    QuickTableRow,
    QuickListOptions,
    QuickInputOptions,
    QuickSparklineOptions,
    QuickStatusOptions,
    QuickLogViewOptions,
} from './widgets.js';

// ── Reactive ──────────────────────────────────────────
export { resolve, isReactive } from './reactive.js';
export type { Reactive } from './reactive.js';
