// ─────────────────────────────────────────────────────
// @termuijs/core — Terminal adapter
// ─────────────────────────────────────────────────────

import { ColorDepth, detectColorDepth } from '../style/Color.js';
import * as ansi from '../utils/ansi.js';

export interface TerminalOptions {
    /** Override stdout stream (useful for testing) */
    stdout?: NodeJS.WriteStream;
    /** Override stdin stream (useful for testing) */
    stdin?: NodeJS.ReadStream;
    /** Force a specific color depth */
    colorDepth?: ColorDepth;
    /** Enable mouse tracking */
    mouse?: boolean;
    /** Use alternate screen buffer for full-screen apps */
    altScreen?: boolean;
}

/**
 * Terminal adapter — wraps process.stdout/stdin and manages
 * terminal state (raw mode, cursor, mouse, alternate screen).
 */
export class Terminal {
    readonly stdout: NodeJS.WriteStream;
    readonly stdin: NodeJS.ReadStream;
    readonly colorDepth: ColorDepth;

    private _cols: number;
    private _rows: number;
    private _isRawMode = false;
    private _isAltScreen = false;
    private _isMouseEnabled = false;
    private _resizeHandlers: Array<(cols: number, rows: number) => void> = [];
    private _cleanupHandlers: Array<() => void> = [];
    private _originalRawMode: boolean | undefined;

    constructor(options: TerminalOptions = {}) {
        this.stdout = options.stdout ?? process.stdout;
        this.stdin = options.stdin ?? process.stdin;
        this.colorDepth = options.colorDepth ?? detectColorDepth();

        this._cols = this.stdout.columns ?? 80;
        this._rows = this.stdout.rows ?? 24;

        // Listen for terminal resize
        this.stdout.on('resize', () => {
            this._cols = this.stdout.columns ?? 80;
            this._rows = this.stdout.rows ?? 24;
            for (const handler of this._resizeHandlers) {
                handler(this._cols, this._rows);
            }
        });

        // Set up cleanup on process exit
        this._setupCleanup();
    }

    /** Current terminal width in columns */
    get cols(): number { return this._cols; }
    /** Current terminal height in rows */
    get rows(): number { return this._rows; }

    /** Whether stdin is a TTY (interactive) */
    isInteractive(): boolean {
        return Boolean(this.stdin.isTTY) && !process.env['CI'];
    }

    /** Whether the terminal supports raw mode */
    supportsRawMode(): boolean {
        return Boolean(this.stdin.isTTY && typeof this.stdin.setRawMode === 'function');
    }

    // ── Raw Mode ────────────────────────────────────────

    enterRawMode(): void {
        if (this._isRawMode || !this.supportsRawMode()) return;
        this._originalRawMode = this.stdin.isRaw;
        this.stdin.setRawMode(true);
        this.stdin.resume();
        this._isRawMode = true;
    }

    exitRawMode(): void {
        if (!this._isRawMode) return;
        this.stdin.setRawMode(this._originalRawMode ?? false);
        this.stdin.pause();
        this._isRawMode = false;
    }

    // ── Alternate Screen ────────────────────────────────

    enterAltScreen(): void {
        if (this._isAltScreen) return;
        this.write(ansi.enterAltScreen);
        this._isAltScreen = true;
    }

    exitAltScreen(): void {
        if (!this._isAltScreen) return;
        this.write(ansi.exitAltScreen);
        this._isAltScreen = false;
    }

    // ── Mouse ───────────────────────────────────────────

    enableMouse(): void {
        if (this._isMouseEnabled) return;
        this.write(ansi.enableMouse);
        this._isMouseEnabled = true;
    }

    disableMouse(): void {
        if (!this._isMouseEnabled) return;
        this.write(ansi.disableMouse);
        this._isMouseEnabled = false;
    }

    // ── Cursor ──────────────────────────────────────────

    hideCursor(): void { this.write(ansi.hideCursor); }
    showCursor(): void { this.write(ansi.showCursor); }

    // ── Output ──────────────────────────────────────────

    write(data: string): void {
        this.stdout.write(data);
    }

    // ── Resize ──────────────────────────────────────────

    onResize(handler: (cols: number, rows: number) => void): () => void {
        this._resizeHandlers.push(handler);
        return () => {
            const idx = this._resizeHandlers.indexOf(handler);
            if (idx >= 0) this._resizeHandlers.splice(idx, 1);
        };
    }

    // ── Cleanup ─────────────────────────────────────────

    /**
     * Restore terminal to its original state.
     * Called automatically on SIGINT, SIGTERM, process exit.
     */
    restore(): void {
        this.disableMouse();
        this.exitAltScreen();
        this.exitRawMode();
        this.showCursor();
        this.write(ansi.reset);
    }

    /**
     * Register a custom cleanup handler that runs on terminal restore.
     */
    onCleanup(handler: () => void): void {
        this._cleanupHandlers.push(handler);
    }

    private _setupCleanup(): void {
        const cleanup = () => {
            for (const handler of this._cleanupHandlers) {
                try { handler(); } catch { /* swallow */ }
            }
            this.restore();
        };

        process.on('exit', cleanup);
        process.on('SIGINT', () => { cleanup(); process.exit(130); });
        process.on('SIGTERM', () => { cleanup(); process.exit(143); });
        process.on('uncaughtException', (err) => {
            cleanup();
            console.error(err);
            process.exit(1);
        });
    }
}
