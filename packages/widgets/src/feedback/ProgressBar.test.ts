// ─────────────────────────────────────────────────────
// @termuijs/widgets — Tests for ProgressBar widget
// ─────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { ProgressBar } from './ProgressBar.js';

describe('ProgressBar', () => {
    it('initializes with default value 0', () => {
        const pb = new ProgressBar();
        expect(pb.value).toBe(0);
    });

    it('setValue sets progress to 0.5', () => {
        const pb = new ProgressBar();
        pb.setValue(0.5);
        expect(pb.value).toBe(0.5);
    });

    it('setValue(1) sets to 100%', () => {
        const pb = new ProgressBar();
        pb.setValue(1);
        expect(pb.value).toBe(1);
    });

    it('clamps values above 1 to 1', () => {
        const pb = new ProgressBar();
        pb.setValue(1.5);
        expect(pb.value).toBe(1);
    });

    it('clamps values below 0 to 0', () => {
        const pb = new ProgressBar();
        pb.setValue(-0.5);
        expect(pb.value).toBe(0);
    });
});
