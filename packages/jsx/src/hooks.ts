// ─────────────────────────────────────────────────────
// @termuijs/jsx — Hooks Engine
//
// A minimal React-like hooks runtime. Each functional
// component gets a Fiber that tracks its hook state.
// Hooks are called in order — same rules as React.
// ─────────────────────────────────────────────────────

import type { KeyEvent } from '@termuijs/core';

// ── Fiber — per-component-instance state ──

export interface Fiber {
    id: number;
    hooks: HookState[];
    hookIndex: number;
    isDirty: boolean;
    onInput?: (event: KeyEvent) => void;
    effects: EffectRecord[];
    cleanups: (() => void)[];
    intervals: ReturnType<typeof setInterval>[];
}

interface HookState {
    value: any;
    deps?: any[];
}

interface EffectRecord {
    effect: () => void | (() => void);
    deps?: any[];
    cleanup?: () => void;
    ran: boolean;
}

// ── Global state ──

let _currentFiber: Fiber | null = null;
let _requestRender: (() => void) | null = null;
let _nextFiberId = 0;

/** Get or throw the current fiber (hooks must be called inside a component) */
function currentFiber(): Fiber {
    if (!_currentFiber) {
        throw new Error(
            'Hooks can only be called inside a functional component. ' +
            'Make sure you are not calling hooks outside of a render cycle.'
        );
    }
    return _currentFiber;
}

/** Set the current render context */
export function setCurrentFiber(fiber: Fiber): void {
    _currentFiber = fiber;
    fiber.hookIndex = 0; // Reset for each render pass
}

/** Clear the current render context */
export function clearCurrentFiber(): void {
    _currentFiber = null;
}

/** Create a new Fiber for a component instance */
export function createFiber(): Fiber {
    return {
        id: _nextFiberId++,
        hooks: [],
        hookIndex: 0,
        isDirty: true,
        effects: [],
        cleanups: [],
        intervals: [],
    };
}

/** Set the requestRender callback (called by the renderer) */
export function setRequestRender(fn: () => void): void {
    _requestRender = fn;
}

/** Schedule a re-render */
function scheduleRender(): void {
    _requestRender?.();
}

// ── Hooks ──

/**
 * useState — manage component state.
 *
 * ```tsx
 * const [count, setCount] = useState(0);
 * setCount(prev => prev + 1);
 * ```
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void] {
    const fiber = currentFiber();
    const idx = fiber.hookIndex++;

    // Initialize on first render
    if (idx >= fiber.hooks.length) {
        const value = typeof initialValue === 'function'
            ? (initialValue as () => T)()
            : initialValue;
        fiber.hooks.push({ value });
    }

    const hookState = fiber.hooks[idx];

    const setState = (newValue: T | ((prev: T) => T)) => {
        const prev = hookState.value;
        const next = typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        if (!Object.is(prev, next)) {
            hookState.value = next;
            fiber.isDirty = true;
            scheduleRender();
        }
    };

    return [hookState.value, setState];
}

/**
 * useEffect — run side effects after render.
 *
 * ```tsx
 * useEffect(() => {
 *     const sub = subscribe();
 *     return () => sub.unsubscribe(); // cleanup
 * }, [dep]);
 * ```
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
    const fiber = currentFiber();
    const idx = fiber.hookIndex++;

    // Initialize or check deps
    if (idx >= fiber.hooks.length) {
        fiber.hooks.push({ value: null, deps });
        fiber.effects.push({ effect, deps, ran: false });
    } else {
        const prev = fiber.hooks[idx];
        const shouldRun = !deps || !prev.deps || deps.some((d, i) => !Object.is(d, prev.deps![i]));

        if (shouldRun) {
            prev.deps = deps;
            // Find existing effect record or push a new one
            const effectIdx = fiber.effects.findIndex(e => e === fiber.hooks[idx].value);
            if (effectIdx >= 0) {
                fiber.effects[effectIdx] = { effect, deps, ran: false };
            } else {
                const record = { effect, deps, ran: false };
                fiber.hooks[idx].value = record;
                fiber.effects.push(record);
            }
        }
    }
}

/**
 * useInput — handle keyboard input in the component.
 *
 * ```tsx
 * useInput((key, event) => {
 *     if (key === 'q') process.exit(0);
 *     if (key === 'up') selectPrev();
 * });
 * ```
 */
export function useInput(handler: (key: string, event: KeyEvent) => void): void {
    const fiber = currentFiber();
    fiber.onInput = (event: KeyEvent) => handler(event.key, event);
}

/**
 * useInterval — call a function at regular intervals (auto-cleans up).
 *
 * ```tsx
 * useInterval(() => {
 *     setData(fetchData());
 * }, 1000);
 * ```
 */
export function useInterval(callback: () => void, delayMs: number): void {
    const fiber = currentFiber();
    const idx = fiber.hookIndex++;

    if (idx >= fiber.hooks.length) {
        const timer = setInterval(() => {
            callback();
            scheduleRender();
        }, delayMs);
        fiber.hooks.push({ value: timer });
        fiber.intervals.push(timer);
    }
}

/**
 * useMemo — memoize expensive computations.
 *
 * ```tsx
 * const sorted = useMemo(() => items.sort(), [items]);
 * ```
 */
export function useMemo<T>(factory: () => T, deps: any[]): T {
    const fiber = currentFiber();
    const idx = fiber.hookIndex++;

    if (idx >= fiber.hooks.length) {
        const value = factory();
        fiber.hooks.push({ value, deps });
        return value;
    }

    const prev = fiber.hooks[idx];
    const changed = !prev.deps || deps.some((d, i) => !Object.is(d, prev.deps![i]));

    if (changed) {
        prev.value = factory();
        prev.deps = deps;
    }

    return prev.value;
}

/**
 * useRef — mutable ref that persists across renders.
 *
 * ```tsx
 * const inputRef = useRef('');
 * inputRef.current = 'hello';
 * ```
 */
export function useRef<T>(initialValue: T): { current: T } {
    const fiber = currentFiber();
    const idx = fiber.hookIndex++;

    if (idx >= fiber.hooks.length) {
        fiber.hooks.push({ value: { current: initialValue } });
    }

    return fiber.hooks[idx].value;
}

/**
 * useCallback — memoize a callback function.
 */
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
    return useMemo(() => callback, deps);
}

/** Run all pending effects for a fiber */
export function runEffects(fiber: Fiber): void {
    for (const record of fiber.effects) {
        if (!record.ran) {
            // Run cleanup from previous effect
            record.cleanup?.();
            const cleanup = record.effect();
            if (typeof cleanup === 'function') {
                record.cleanup = cleanup;
            }
            record.ran = true;
        }
    }
}

/** Clean up all effects and intervals for a fiber */
export function destroyFiber(fiber: Fiber): void {
    // Run effect cleanups
    for (const record of fiber.effects) {
        record.cleanup?.();
    }
    for (const cleanup of fiber.cleanups) {
        cleanup();
    }
    // Clear intervals
    for (const timer of fiber.intervals) {
        clearInterval(timer);
    }
    fiber.hooks = [];
    fiber.effects = [];
    fiber.cleanups = [];
    fiber.intervals = [];
}
