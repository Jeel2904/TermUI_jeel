// ─────────────────────────────────────────────────────
// Router — manages screen navigation
// ─────────────────────────────────────────────────────

import { EventEmitter } from '@termuijs/core';
import { type Route, type RouteMatch, type RouteParams, matchRoute, compilePattern } from './route.js';

export interface RouterEvents {
    navigate: RouteMatch;
    back: RouteMatch | null;
    error: Error;
}

export interface RouterOptions {
    /** Initial path */
    initialPath?: string;
}

export class Router {
    private _routes: Route[] = [];
    private _history: string[] = [];
    private _currentMatch: RouteMatch | null = null;
    readonly events = new EventEmitter<RouterEvents>();

    constructor(options: RouterOptions = {}) {
        if (options.initialPath) {
            this._history.push(options.initialPath);
        }
    }

    /** Register a route */
    addRoute(path: string, component: () => any, layout?: () => any): void {
        const { pattern, paramNames } = compilePattern(path);
        this._routes.push({ path, pattern, paramNames, component, layout });
    }

    /** Register multiple routes */
    addRoutes(routes: Array<{ path: string; component: () => any; layout?: () => any }>): void {
        for (const r of routes) this.addRoute(r.path, r.component, r.layout);
    }

    /** Navigate to a path */
    push(path: string): void {
        const match = matchRoute(path, this._routes);
        if (!match) {
            this.events.emit('error', new Error(`No route found for path: ${path}`));
            return;
        }
        this._history.push(path);
        this._currentMatch = match;
        this.events.emit('navigate', match);
    }

    /** Replace current path */
    replace(path: string): void {
        const match = matchRoute(path, this._routes);
        if (!match) {
            this.events.emit('error', new Error(`No route found for path: ${path}`));
            return;
        }
        if (this._history.length > 0) {
            this._history[this._history.length - 1] = path;
        } else {
            this._history.push(path);
        }
        this._currentMatch = match;
        this.events.emit('navigate', match);
    }

    /** Go back in history */
    back(): void {
        if (this._history.length <= 1) return;
        this._history.pop();
        const prevPath = this._history[this._history.length - 1];
        const match = prevPath ? matchRoute(prevPath, this._routes) : null;
        this._currentMatch = match;
        this.events.emit('back', match);
    }

    /** Current route match */
    get current(): RouteMatch | null { return this._currentMatch; }

    /** Current path */
    get currentPath(): string { return this._history[this._history.length - 1] ?? '/'; }

    /** Current route params */
    get params(): RouteParams { return this._currentMatch?.params ?? {}; }

    /** History stack depth */
    get historyLength(): number { return this._history.length; }

    /** Check if we can go back */
    get canGoBack(): boolean { return this._history.length > 1; }

    /** All registered routes */
    get routes(): Route[] { return [...this._routes]; }
}
