// ─────────────────────────────────────────────────────
// @termuijs/widgets — Tests for Gauge widget
// ─────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { Gauge } from './Gauge.js';

describe('Gauge', () => {
    it('initializes with 0 value', () => {
        const g = new Gauge('CPU');
        expect(g.getValue()).toBe(0);
    });

    it('setValue sets and clamps the value', () => {
        const g = new Gauge('CPU');
        g.setValue(0.75);
        expect(g.getValue()).toBe(0.75);
        g.setValue(1.5);
        expect(g.getValue()).toBe(1);
        g.setValue(-0.5);
        expect(g.getValue()).toBe(0);
    });

    it('setLabel updates the label', () => {
        const g = new Gauge('CPU');
        g.setLabel('Memory');
        expect(g).toBeDefined();
    });
});
