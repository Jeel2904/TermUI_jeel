// ─────────────────────────────────────────────────────
// @termuijs/motion — Tests for Transitions (easing functions)
// ─────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { easings } from './transitions.js';

describe('Easing Functions', () => {
    it('linear(0) = 0 and linear(1) = 1', () => {
        expect(easings.linear(0)).toBe(0);
        expect(easings.linear(1)).toBe(1);
    });

    it('linear(0.5) = 0.5', () => {
        expect(easings.linear(0.5)).toBe(0.5);
    });

    it('easeIn starts slow (value < t for small t)', () => {
        const t = 0.3;
        expect(easings.easeIn(t)).toBeLessThan(t);
    });

    it('easeOut starts fast (value > t for small t)', () => {
        const t = 0.3;
        expect(easings.easeOut(t)).toBeGreaterThan(t);
    });

    it('easeInOut is symmetric around 0.5', () => {
        const a = easings.easeInOut(0.25);
        const b = easings.easeInOut(0.75);
        expect(a + b).toBeCloseTo(1, 5);
    });

    it('all easings return 0 at t=0 and 1 at t=1', () => {
        for (const [name, fn] of Object.entries(easings)) {
            expect(fn(0)).toBeCloseTo(0, 5);
            expect(fn(1)).toBeCloseTo(1, 5);
        }
    });
});
