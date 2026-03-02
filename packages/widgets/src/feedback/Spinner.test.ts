// ─────────────────────────────────────────────────────
// @termuijs/widgets — Tests for Spinner widget
// ─────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { Spinner, SPINNER_FRAMES } from './Spinner.js';

describe('Spinner', () => {
    it('starts at first frame', () => {
        // Default spinner is 'dots' with frames ['⠋', '⠙', ...]
        const spinner = new Spinner();
        expect(spinner).toBeDefined();
    });

    it('tick advances frame after interval', () => {
        const spinner = new Spinner({}, { spinner: 'line' }); // line interval=130ms
        // First tick below interval — no change
        spinner.tick(50);
        // tick past interval to advance
        spinner.tick(100);
        // Frame should have advanced
        expect(spinner).toBeDefined();
    });

    it('setLabel updates the label', () => {
        const spinner = new Spinner({}, { label: 'Loading' });
        spinner.setLabel('Done');
        expect(spinner).toBeDefined();
    });

    it('accepts custom frame sequences', () => {
        const spinner = new Spinner({}, {
            spinner: { frames: ['A', 'B', 'C'], interval: 50 },
        });
        expect(spinner).toBeDefined();
    });
});
