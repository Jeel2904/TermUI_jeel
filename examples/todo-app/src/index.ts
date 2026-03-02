// ─────────────────────────────────────────────────────
// Todo App — built with @termuijs/quick
//
// ~20 lines: interactive list + text input
// ─────────────────────────────────────────────────────

import { app, row, col, list, input, text, gauge } from '@termuijs/quick';

const todos: string[] = ['Learn TermUI', 'Build a CLI app', 'Ship to npm'];

app('✅ Todo App')
    .rows(
        // Header with progress
        row(
            text(() => `${todos.filter(t => t.startsWith('✓')).length}/${todos.length} done`, { bold: true, color: { type: 'named', name: 'green' } }),
            gauge('Progress', () => todos.filter(t => t.startsWith('✓')).length / Math.max(todos.length, 1)),
        ),
        // Todo list
        list(() => todos, {
            selectable: true,
            onSelect: (idx: number) => {
                todos[idx] = todos[idx].startsWith('✓ ')
                    ? todos[idx].slice(2)
                    : `✓ ${todos[idx]}`;
            },
        }),
        // Input to add new todos
        input('Type a todo and press Enter...', {
            onSubmit: (value: string) => {
                if (value.trim()) todos.push(value.trim());
            },
        }),
    )
    .keys({ q: 'quit', '↑↓': 'navigate', '⏎': 'toggle/add' })
    .refresh('500ms')
    .run();
