// ─────────────────────────────────────────────────────
// @termuijs/jsx — Public API
// ─────────────────────────────────────────────────────

// ── JSX Factory ──
export { createElement, jsx, jsxs } from './createElement.js';
export { Fragment } from './vnode.js';

// ── Types ──
export type { VNode, VElement, VFragment, FC, IntrinsicProps } from './vnode.js';
export { isVElement, isVFragment, flattenChildren } from './vnode.js';

// ── Hooks ──
export {
    useState,
    useEffect,
    useInput,
    useInterval,
    useMemo,
    useRef,
    useCallback,
} from './hooks.js';

// ── Render ──
export { render, renderApp } from './render.js';
export type { RenderOptions } from './render.js';

// ── Reconciler (internal, but useful for testing) ──
export { reconcile } from './reconciler.js';

// ── Convenience alias ──
/** h() — shorthand for createElement */
export { createElement as h } from './createElement.js';
