// ─────────────────────────────────────────────────────
// JSX Dashboard — React-like terminal UI
//
// This demo showcases the @termuijs/jsx API:
//   ✓ Uses .tsx file extension with JSX compilation
//   ✓ Functional component patterns
//   ✓ Same data providers as system-monitor
//   ✓ @termuijs/quick fluent API
//
// Run: cd examples/jsx-dashboard && pnpm start
// ─────────────────────────────────────────────────────

import { app, row, gauge, sparkline, table, text, status } from '@termuijs/quick';
import { cpu, memory, disk, processes, system, network } from '@termuijs/data';

// Keep a rolling history for sparklines
const cpuHistory: number[] = [];
const memHistory: number[] = [];

app('⚡ JSX Dashboard')
    .rows(
        // Header
        text(() => `  ${system.hostname} • ${system.platform} • up ${system.uptime}`, {
            bold: true,
            color: { type: 'named', name: 'cyan' },
        }),

        // Gauges
        row(
            gauge('CPU', () => {
                const pct = cpu.percent;
                cpuHistory.push(pct);
                if (cpuHistory.length > 40) cpuHistory.shift();
                return pct / 100;
            }, { color: { type: 'named', name: 'green' } }),
            gauge('MEM', () => {
                const pct = memory.percent;
                memHistory.push(pct);
                if (memHistory.length > 40) memHistory.shift();
                return pct / 100;
            }, { color: { type: 'named', name: 'yellow' } }),
            gauge('DSK', () => disk.percent / 100, { color: { type: 'named', name: 'magenta' } }),
        ),

        // Sparklines
        row(
            sparkline('CPU ▸', () => [...cpuHistory], { color: { type: 'named', name: 'green' } }),
            sparkline('MEM ▸', () => [...memHistory], { color: { type: 'named', name: 'yellow' } }),
        ),

        // Process table
        table(
            'Top Processes',
            () => processes.top(10).map(p => ({
                Name: p.name.slice(0, 18),
                PID: p.pid,
                'CPU%': p.cpu.toFixed(1),
                'MEM%': p.mem.toFixed(1),
                User: p.user,
            })),
            ['Name', 'PID', 'CPU%', 'MEM%', 'User'],
        ),

        // Network status
        row(
            ...network.interfaces.map(iface =>
                status(iface.name, () => true, { upColor: { type: 'named', name: 'green' } })
            ),
        ),

        // Footer
        text('  q quit  •  r refresh  •  Built with @termuijs/jsx ⚡', { dim: true }),
    )
    .keys({ q: 'quit', r: 'refresh' })
    .refresh('1s')
    .run();
