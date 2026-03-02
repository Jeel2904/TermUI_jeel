// ─────────────────────────────────────────────────────
// TermUI Example — Interactive Dashboard
// ─────────────────────────────────────────────────────
//
// Run with:  npx tsx src/index.ts
//
// Features demonstrated:
// - Box layout with borders and padding
// - Text rendering with alignment
// - ProgressBar with dynamic updates
// - Spinner animation
// - Table with data
// - Keyboard input handling (q to quit, r to reset)
// - Graceful CI/pipe fallback
//

import { App } from '@termuijs/core';
import {
    Box,
    Text,
    ProgressBar,
    Spinner,
    Table,
    Widget,
} from '@termuijs/widgets';
import type { Screen, KeyEvent } from '@termuijs/core';

// ── Dashboard Root Widget ────────────────────────────

class Dashboard extends Widget {
    private _title: Text;
    private _container: Box;
    private _statusBar: Text;
    private _progressBar: ProgressBar;
    private _spinner: Spinner;
    private _table: Table;
    private _progress = 0;

    constructor() {
        super({
            flexDirection: 'column',
        });

        // ── Header ──
        this._title = new Text('⚡ TermUI Dashboard', {
            bold: true,
            fg: { type: 'named', name: 'cyan' },
            height: 1,
        }, { align: 'center' });

        // ── Main container ──
        this._container = new Box({
            flexDirection: 'row',
            flexGrow: 1,
            gap: 1,
        });

        // ── Left panel: Stats ──
        const leftPanel = new Box({
            border: 'round',
            borderColor: { type: 'named', name: 'blue' },
            flexGrow: 1,
            padding: 1,
            flexDirection: 'column',
            gap: 1,
        });

        const statsTitle = new Text('📊 System Monitor', {
            bold: true,
            fg: { type: 'named', name: 'yellow' },
            height: 1,
        });

        this._progressBar = new ProgressBar(
            { height: 1 },
            {
                value: 0.65,
                fillColor: { type: 'named', name: 'green' },
                showLabel: true,
            },
        );

        this._spinner = new Spinner(
            { height: 1 },
            { spinner: 'dots', label: 'Processing data...', color: { type: 'named', name: 'magenta' } },
        );

        leftPanel.addChild(statsTitle);
        leftPanel.addChild(new Text('CPU Usage:', { height: 1, dim: true }));
        leftPanel.addChild(this._progressBar);
        leftPanel.addChild(this._spinner);

        // ── Right panel: Table ──
        const rightPanel = new Box({
            border: 'single',
            borderColor: { type: 'named', name: 'green' },
            flexGrow: 2,
            padding: 1,
        });

        this._table = new Table(
            [
                { header: 'Service', key: 'name', width: 15 },
                { header: 'Status', key: 'status', width: 10 },
                { header: 'Uptime', key: 'uptime', align: 'right' },
            ],
            [
                { name: 'API Server', status: '● Online', uptime: '14d 6h' },
                { name: 'Database', status: '● Online', uptime: '30d 2h' },
                { name: 'Cache', status: '● Online', uptime: '7d 12h' },
                { name: 'Worker', status: '○ Offline', uptime: '—' },
                { name: 'Scheduler', status: '● Online', uptime: '3d 8h' },
            ],
            { flexGrow: 1 },
            { stripe: true },
        );

        rightPanel.addChild(this._table);

        this._container.addChild(leftPanel);
        this._container.addChild(rightPanel);

        // ── Status bar ──
        this._statusBar = new Text(
            '  q Quit  •  r Reset Progress  •  TermUI v0.1.0',
            {
                height: 1,
                fg: { type: 'named', name: 'brightBlack' },
            },
        );

        this.addChild(this._title);
        this.addChild(this._container);
        this.addChild(this._statusBar);
    }

    /**
     * Handle keyboard input for the dashboard.
     */
    handleKey(event: KeyEvent): boolean {
        if (event.key === 'q' || (event.ctrl && event.key === 'c')) {
            return false; // signal exit
        }
        if (event.key === 'r') {
            this._progress = 0;
            this._progressBar.setValue(0);
        }
        return true;
    }

    /**
     * Called on each tick to animate the spinner and progress.
     */
    tick(deltaMs: number): void {
        this._spinner.tick(deltaMs);
        this._progress = Math.min(1, this._progress + 0.002);
        this._progressBar.setValue(this._progress);
    }

    protected _renderSelf(_screen: Screen): void {
        // No custom rendering — children handle everything
    }
}

// ── Main ─────────────────────────────────────────────

async function main() {
    const dashboard = new Dashboard();

    const app = new App(dashboard, {
        fullscreen: true,
        title: 'TermUI Dashboard',
        fps: 30,
    });

    // Handle keyboard input
    app.events.on('key', (event) => {
        const shouldContinue = dashboard.handleKey(event);
        if (!shouldContinue) {
            app.exit(0);
        }
        app.requestRender();
    });

    // Animation loop — spin spinner + grow progress bar
    let lastTick = Date.now();
    const tickInterval = setInterval(() => {
        const now = Date.now();
        dashboard.tick(now - lastTick);
        lastTick = now;
        app.requestRender();
    }, 33); // ~30fps

    app.terminal.onCleanup(() => {
        clearInterval(tickInterval);
    });

    // mount() blocks until exit() is called
    const exitCode = await app.mount();
    clearInterval(tickInterval);
    process.exit(exitCode);
}

main().catch((err) => {
    console.error('Dashboard error:', err);
    process.exit(1);
});
