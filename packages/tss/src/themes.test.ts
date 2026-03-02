// ─────────────────────────────────────────────────────
// @termuijs/tss — Tests for Built-in Themes
// ─────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { getBuiltinThemeNames, getBuiltinTheme, getAllBuiltinThemes } from './themes.js';

describe('Built-in Themes', () => {
    it('getBuiltinThemeNames returns all theme names', () => {
        const names = getBuiltinThemeNames();
        expect(names).toContain('default');
        expect(names).toContain('cyberpunk');
        expect(names).toContain('nord');
        expect(names).toContain('dracula');
        expect(names).toContain('catppuccin');
        expect(names).toContain('solarized');
        expect(names.length).toBeGreaterThanOrEqual(6);
    });

    it('getBuiltinTheme returns source for valid name', () => {
        const src = getBuiltinTheme('nord');
        expect(src).toBeDefined();
        expect(src).toContain('@theme nord');
    });

    it('getBuiltinTheme returns undefined for unknown name', () => {
        expect(getBuiltinTheme('nonexistent')).toBeUndefined();
    });

    it('getAllBuiltinThemes combines all sources', () => {
        const combined = getAllBuiltinThemes();
        expect(combined).toContain('@theme default');
        expect(combined).toContain('@theme nord');
        expect(combined).toContain('@theme cyberpunk');
    });
});
