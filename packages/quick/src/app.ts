// ─────────────────────────────────────────────────────
// @termuijs/quick — AppBuilder: the fluent API entry point
// ─────────────────────────────────────────────────────

import { App, type KeyEvent, type EventMap } from '@termuijs/core';
import { Box, Text, Widget, Gauge, Sparkline, StatusIndicator, Table, LogView, List, TextInput } from '@termuijs/widgets';
import type { LayoutChild } from './layout.js';
import { toWidget, col } from './layout.js';
import { resolve, isReactive, type Reactive } from './reactive.js';

export interface QuickKeyAction {
    key: string;
    action: string | (() => void);
}

function parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(ms|s|m)$/);
    if (!match) return 1000;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
        case 'ms': return value;
        case 's': return value * 1000;
        case 'm': return value * 60000;
        default: return 1000;
    }
}

/**
 * Walk a widget tree and collect all widgets matching a predicate.
 */
function walkWidgets(root: Widget, predicate: (w: Widget) => boolean): Widget[] {
    const result: Widget[] = [];
    const stack: Widget[] = [root];
    while (stack.length > 0) {
        const w = stack.pop()!;
        if (predicate(w)) result.push(w);
        for (const child of w.children) stack.push(child);
    }
    return result;
}

/**
 * The main fluent builder. Users call `app('title')` to start.
 *
 * @example
 * ```ts
 * app('My Dashboard')
 *   .rows(
 *     row(gauge('CPU', cpu.percent), gauge('Mem', memory.percent)),
 *     table('Processes', processes.top(5), ['name', 'cpu%']),
 *   )
 *   .keys({ q: 'quit', r: 'refresh' })
 *   .refresh('1s')
 *   .run();
 * ```
 */
export class AppBuilder {
    private _title: string;
    private _children: LayoutChild[] = [];
    private _keyMap: Record<string, string | (() => void)> = {};
    private _refreshInterval: number | null = null;
    private _fullscreen = true;
    private _app: App | null = null;

    constructor(title: string) {
        this._title = title;
    }

    /**
     * Set the layout using vertical rows.
     */
    rows(...children: LayoutChild[]): this {
        this._children = children;
        return this;
    }

    /**
     * Bind hotkeys:
     * - `'quit'` — exits the app
     * - `'refresh'` — forces an immediate refresh
     * - `() => void` — custom handler
     */
    keys(map: Record<string, string | (() => void)>): this {
        this._keyMap = { ...this._keyMap, ...map };
        return this;
    }

    /**
     * Set auto-refresh interval. Accepts: '500ms', '1s', '5s', '1m'.
     */
    refresh(interval: string): this {
        this._refreshInterval = parseInterval(interval);
        return this;
    }

    /**
     * Set fullscreen mode (default: true).
     */
    fullscreen(enabled: boolean): this {
        this._fullscreen = enabled;
        return this;
    }

    /**
     * Build the widget tree and run the app.
     * Returns a promise that resolves when the app exits.
     */
    async run(): Promise<number> {
        // Build the root widget tree
        const root = new Box({
            flexDirection: 'column',
            width: '100%',
            height: '100%',
        });

        // Title bar
        const titleBar = new Text(`  ${this._title}`, {
            height: 1,
            bold: true,
            fg: { type: 'named', name: 'cyan' },
        }, { align: 'center' });
        root.addChild(titleBar);

        // Content area
        const content = new Box({
            flexDirection: 'column',
            flexGrow: 1,
        });
        for (const child of this._children) {
            content.addChild(toWidget(child));
        }
        root.addChild(content);

        // Footer with key hints
        const keyHints = Object.entries(this._keyMap)
            .map(([key, action]) => {
                const label = typeof action === 'string' ? action : key;
                return `${key} ${label}`;
            })
            .join('  •  ');
        if (keyHints) {
            const footer = new Text(`  ${keyHints}`, {
                height: 1,
                dim: true,
            });
            root.addChild(footer);
        }

        // Create the App
        const appInstance = new App(root, { fullscreen: this._fullscreen });
        this._app = appInstance;

        // ── Discover focusable widgets (List, TextInput) ──
        const listWidgets = walkWidgets(root, w => w instanceof List) as List[];
        const inputWidgets = walkWidgets(root, w => w instanceof TextInput) as TextInput[];
        const focusableWidgets: Widget[] = [...listWidgets, ...inputWidgets];

        // Register focusable widgets with the focus manager
        let _focusedIdx = -1;
        if (focusableWidgets.length > 0) {
            focusableWidgets.forEach((w, i) => {
                appInstance.focus.register({ id: `quick-${i}`, tabIndex: i, focusable: true });
            });
            // Auto-focus the first one
            _focusedIdx = 0;
            focusableWidgets[0].isFocused = true;

            // Listen for focus changes
            appInstance.focus.on('focus', (evt) => {
                const idx = parseInt(evt.targetId.replace('quick-', ''), 10);
                if (!isNaN(idx) && idx < focusableWidgets.length) {
                    focusableWidgets.forEach(w => (w.isFocused = false));
                    focusableWidgets[idx].isFocused = true;
                    _focusedIdx = idx;
                }
            });
            appInstance.focus.on('blur', (evt) => {
                const idx = parseInt(evt.targetId.replace('quick-', ''), 10);
                if (!isNaN(idx) && idx < focusableWidgets.length) {
                    focusableWidgets[idx].isFocused = false;
                }
            });
        }

        // ── Wire up key events: dispatch to focused widget + handle app bindings ──
        appInstance.events.on('key', (event: KeyEvent) => {
            // 1. Check app-level key bindings first
            const action = this._keyMap[event.key];
            if (action) {
                if (action === 'quit') {
                    appInstance.exit();
                    return;
                } else if (action === 'refresh') {
                    this._refreshReactiveWidgets(root);
                    appInstance.requestRender();
                    return;
                } else if (typeof action === 'function') {
                    action();
                    appInstance.requestRender();
                    return;
                }
            }

            // 2. Handle Ctrl+C to quit
            if (event.ctrl && event.key === 'c') {
                appInstance.exit();
                return;
            }

            // 3. Tab cycles focus between focusable widgets
            if (event.key === 'tab' && focusableWidgets.length > 1) {
                if (event.shift) {
                    appInstance.focus.focusPrev();
                } else {
                    appInstance.focus.focusNext();
                }
                appInstance.requestRender();
                return;
            }

            // 4. Dispatch key to the currently focused widget
            if (_focusedIdx >= 0 && _focusedIdx < focusableWidgets.length) {
                const focused = focusableWidgets[_focusedIdx];

                if (focused instanceof List) {
                    switch (event.key) {
                        case 'up':
                        case 'k':
                            focused.selectPrev();
                            break;
                        case 'down':
                        case 'j':
                            focused.selectNext();
                            break;
                        case 'enter':
                        case ' ':
                            focused.confirm();
                            break;
                        default:
                            return; // Don't re-render for unhandled keys
                    }
                    appInstance.requestRender();
                    return;
                }

                if (focused instanceof TextInput) {
                    switch (event.key) {
                        case 'left':
                            focused.moveCursorLeft();
                            break;
                        case 'right':
                            focused.moveCursorRight();
                            break;
                        case 'backspace':
                            focused.deleteBack();
                            break;
                        case 'delete':
                            focused.deleteForward();
                            break;
                        case 'home':
                            focused.moveCursorHome();
                            break;
                        case 'end':
                            focused.moveCursorEnd();
                            break;
                        case 'enter':
                            focused.submit();
                            focused.clear();
                            break;
                        default:
                            // Printable character
                            if (event.key.length === 1 && !event.ctrl && !event.alt) {
                                focused.insertChar(event.key);
                            }
                            break;
                    }
                    appInstance.requestRender();
                    return;
                }
            }
        });

        // Set up auto-refresh
        let refreshTimer: ReturnType<typeof setInterval> | null = null;
        if (this._refreshInterval) {
            refreshTimer = setInterval(() => {
                this._refreshReactiveWidgets(root);
                appInstance.requestRender();
            }, this._refreshInterval);
        }

        // Clean up on exit
        const origExit = appInstance.exit.bind(appInstance);
        appInstance.exit = (code?: number) => {
            if (refreshTimer) clearInterval(refreshTimer);
            origExit(code);
        };

        return appInstance.mount();
    }

    /**
     * Walk the widget tree and update any reactive values.
     */
    private _refreshReactiveWidgets(widget: Widget): void {
        const w = widget as any;

        // Text — reactive content
        if (widget instanceof Text && w.__reactiveContent) {
            widget.setContent(resolve(w.__reactiveContent));
        }

        // Gauge — reactive value
        if (widget instanceof Gauge && w.__reactiveValue) {
            widget.setValue(resolve(w.__reactiveValue));
        }

        // Table — reactive data
        if (widget instanceof Table && w.__reactiveData) {
            const data: Record<string, string | number>[] = resolve(w.__reactiveData);
            widget.setRows(data);
        }

        // Sparkline — reactive data
        if (widget instanceof Sparkline && w.__reactiveData) {
            widget.setData(resolve(w.__reactiveData));
        }

        // StatusIndicator — reactive status
        if (widget instanceof StatusIndicator && w.__reactiveStatus) {
            widget.setStatus(resolve(w.__reactiveStatus));
        }

        // LogView — reactive lines
        if (widget instanceof LogView && w.__reactiveLines) {
            widget.setLines(resolve(w.__reactiveLines));
        }

        // List — reactive items
        if (widget instanceof List && w.__reactiveItems) {
            const items: string[] = resolve(w.__reactiveItems);
            widget.setItems(items.map(label => ({ label, value: label })));
        }

        // Recurse into children
        for (const child of widget.children) {
            this._refreshReactiveWidgets(child);
        }
    }
}

/**
 * Create a new TermUI app with a fluent builder API.
 *
 * @example
 * ```ts
 * import { app, row, gauge } from '@termuijs/quick';
 * import { cpu, memory } from '@termuijs/data';
 *
 * app('System Monitor')
 *   .rows(
 *     row(gauge('CPU', () => cpu.percent / 100)),
 *     row(gauge('Memory', () => memory.percent / 100)),
 *   )
 *   .keys({ q: 'quit' })
 *   .refresh('1s')
 *   .run();
 * ```
 */
export function app(title: string): AppBuilder {
    return new AppBuilder(title);
}
