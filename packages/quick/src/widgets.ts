// ─────────────────────────────────────────────────────
// @termuijs/quick — Shorthand widget constructors
// ─────────────────────────────────────────────────────

import type { Style, Color } from '@termuijs/core';
import {
    Text,
    Table,
    List,
    TextInput,
    Gauge as GaugeWidget,
    Sparkline as SparklineWidget,
    StatusIndicator as StatusWidget,
    LogView as LogViewWidget,
    Widget,
} from '@termuijs/widgets';
import type { Reactive } from './reactive.js';
import { resolve } from './reactive.js';

// ── Text ──

export interface QuickTextOptions {
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    color?: Color;
    align?: 'left' | 'center' | 'right';
}

/**
 * Create a styled text line.
 */
export function text(content: string | Reactive<string>, opts: QuickTextOptions = {}): Widget {
    const style: Partial<Style> = {
        height: 1,
        bold: opts.bold,
        dim: opts.dim,
        italic: opts.italic,
        fg: opts.color,
    };
    const resolved = typeof content === 'function' ? resolve(content) : content;
    const t = new Text(resolved, style, { align: opts.align });
    // Store reactive getter so AppBuilder can refresh on each tick
    if (typeof content === 'function') {
        (t as any).__reactiveContent = content;
    }
    return t;
}

// ── Gauge ──

export interface QuickGaugeOptions {
    color?: Color;
}

/**
 * Create a gauge (label + bar + percentage).
 * Value can be static or reactive.
 */
export function gauge(label: string, value: Reactive<number>, opts: QuickGaugeOptions = {}): Widget {
    const g = new GaugeWidget(label, { height: 1, flexGrow: 1 }, {
        color: opts.color ?? { type: 'named', name: 'green' },
        showLabel: true,
    });
    g.setValue(resolve(value));
    // Store the reactive getter so the AppBuilder can refresh it
    (g as any).__reactiveValue = value;
    return g;
}

// ── Table ──

export type QuickTableRow = Record<string, string | number>;

/**
 * Create a table from data.
 * Data can be static or reactive.
 */
export function table(
    title: string,
    data: Reactive<QuickTableRow[]>,
    columns: string[],
): Widget {
    const cols = columns.map(key => {
        return { header: key, key };
    });

    const resolved = resolve(data);
    const t = new Table(cols, resolved, {
        flexGrow: 1,
        border: 'single',
        borderColor: { type: 'named', name: 'brightBlack' },
        padding: 1,
    }, { stripe: true });

    (t as any).__reactiveData = data;
    (t as any).__tableTitle = title;
    return t;
}

// ── List ──

export interface QuickListOptions {
    selectable?: boolean;
    onSelect?: (index: number) => void;
    renderItem?: (item: string, index: number, selected: boolean) => string;
}

/**
 * Create an interactive list.
 */
export function list(items: Reactive<string[]>, opts: QuickListOptions = {}): Widget {
    const resolved = resolve(items);
    const listItems = resolved.map(label => ({ label, value: label }));

    const onSelectCb = opts.onSelect
        ? (_item: any, idx: number) => opts.onSelect!(idx)
        : undefined;

    const l = new List(
        listItems,
        { flexGrow: 1, border: 'single', borderColor: { type: 'named', name: 'brightBlack' }, padding: 1 },
        onSelectCb,
    );

    (l as any).__reactiveItems = items;
    return l;
}

// ── Input ──

export interface QuickInputOptions {
    onSubmit?: (value: string) => void;
}

/**
 * Create a text input field.
 */
export function input(placeholder: string, opts: QuickInputOptions = {}): Widget {
    const i = new TextInput(
        { height: 1 },
        { placeholder, onSubmit: opts.onSubmit },
    );

    return i;
}


// ── Sparkline ──

export interface QuickSparklineOptions {
    color?: Color;
}

/**
 * Create a sparkline chart.
 */
export function sparkline(label: string, data: Reactive<number[]>, opts: QuickSparklineOptions = {}): Widget {
    const s = new SparklineWidget(label, { height: 1, flexGrow: 1 }, {
        color: opts.color ?? { type: 'named', name: 'cyan' },
    });
    s.setData(resolve(data));
    (s as any).__reactiveData = data;
    return s;
}

// ── Status ──

export interface QuickStatusOptions {
    upColor?: Color;
    downColor?: Color;
}

/**
 * Create a status indicator.
 */
export function status(label: string, isUp: Reactive<boolean>, opts: QuickStatusOptions = {}): Widget {
    const s = new StatusWidget(label, resolve(isUp), { height: 1, flexGrow: 1 }, {
        upColor: opts.upColor ?? { type: 'named', name: 'green' },
        downColor: opts.downColor ?? { type: 'named', name: 'red' },
    });
    (s as any).__reactiveStatus = isUp;
    return s;
}

// ── LogView ──

export interface QuickLogViewOptions {
    highlight?: Record<string, Color>;
}

/**
 * Create a scrollable log view.
 */
export function logView(lines: Reactive<string[]>, opts: QuickLogViewOptions = {}): Widget {
    const lv = new LogViewWidget(
        { flexGrow: 1, border: 'single', borderColor: { type: 'named', name: 'brightBlack' }, padding: 1 },
        { highlight: opts.highlight, autoScroll: true },
    );
    lv.setLines(resolve(lines));
    (lv as any).__reactiveLines = lines;
    return lv;
}
