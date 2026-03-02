// ─────────────────────────────────────────────────────
// Project Templates — generates files for new apps
// ─────────────────────────────────────────────────────

import { getBuiltinTheme } from '@termuijs/tss';

export interface ProjectConfig {
    name: string;
    template: 'empty' | 'dashboard' | 'interactive-tool' | 'cli-wrapper';
    theme: string;
    features: {
        router: boolean;
        dataProviders: boolean;
        hotReload: boolean;
    };
}

export interface GeneratedFile {
    path: string;
    content: string;
}

export function generateProject(config: ProjectConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // ── package.json ──
    files.push({
        path: 'package.json',
        content: JSON.stringify({
            name: config.name,
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
                dev: 'tsx --watch src/index.tsx',
                build: 'tsup src/index.tsx --format esm',
                start: 'node dist/index.js',
            },
            dependencies: {
                '@termuijs/core': 'latest',
                '@termuijs/widgets': 'latest',
                '@termuijs/ui': 'latest',
                '@termuijs/jsx': 'latest',
                '@termuijs/tss': 'latest',
                ...(config.features.dataProviders ? { '@termuijs/data': 'latest' } : {}),
                ...(config.features.router ? { '@termuijs/router': 'latest' } : {}),
            },
            devDependencies: {
                tsx: '^4.0.0',
                tsup: '^8.0.0',
                typescript: '^5.3.0',
            },
        }, null, 2) + '\n',
    });

    // ── tsconfig.json ──
    files.push({
        path: 'tsconfig.json',
        content: JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'bundler',
                jsx: 'react-jsx',
                jsxImportSource: '@termuijs/jsx',
                strict: true,
                esModuleInterop: true,
                outDir: 'dist',
                rootDir: 'src',
            },
            include: ['src'],
        }, null, 2) + '\n',
    });

    // ── termui.config.ts ──
    files.push({
        path: 'termui.config.ts',
        content: `import { defineConfig } from '@termuijs/core';

export default defineConfig({
    theme: '${config.theme}',
    ${config.features.hotReload ? "hotReload: true," : ''}
    ${config.features.router ? "router: { dir: './screens' }," : ''}
});
`,
    });

    // ── Theme file ──
    const themeSrc = getBuiltinTheme(config.theme);
    if (themeSrc) {
        files.push({ path: `themes/${config.theme}.tss`, content: themeSrc.trim() + '\n' });
    }

    // ── Template-specific files ──
    switch (config.template) {
        case 'dashboard':
            files.push(...generateDashboardTemplate(config));
            break;
        case 'interactive-tool':
            files.push(...generateInteractiveTemplate(config));
            break;
        case 'cli-wrapper':
            files.push(...generateCliWrapperTemplate(config));
            break;
        default:
            files.push(...generateEmptyTemplate(config));
    }

    return files;
}

function generateEmptyTemplate(config: ProjectConfig): GeneratedFile[] {
    return [{
        path: 'src/index.tsx',
        content: `import { app } from '@termuijs/quick';
import { Text, Box } from '@termuijs/ui';

app('${config.name}')
    .rows(
        // Add your widgets here
    )
    .run();
`,
    }];
}

function generateDashboardTemplate(config: ProjectConfig): GeneratedFile[] {
    return [{
        path: 'src/index.tsx',
        content: `import { app, gauge, table, sparkline } from '@termuijs/quick';
${config.features.dataProviders ? "import { cpu, memory, disk, processes } from '@termuijs/data';" : ''}

app('⚡ ${config.name}')
    .rows(
        // Row 1: Gauges
        app.cols(
            gauge('CPU', () => ${config.features.dataProviders ? 'cpu.percent / 100' : '0.5'}),
            gauge('MEM', () => ${config.features.dataProviders ? 'memory.percent / 100' : '0.3'}),
            gauge('DSK', () => ${config.features.dataProviders ? 'disk.percent / 100' : '0.7'}),
        ),
        // Row 2: Table
        table('Processes', {
            columns: ['Name', 'PID', 'CPU%', 'MEM%'],
            data: () => ${config.features.dataProviders
                ? `processes.top(10).map(p => ({
                Name: p.name.slice(0, 18),
                PID: p.pid,
                'CPU%': p.cpu.toFixed(1),
                'MEM%': p.mem.toFixed(1),
            }))`
                : `[{ Name: 'example', PID: 1234, 'CPU%': '5.0', 'MEM%': '2.1' }]`},
        }),
    )
    .run();
`,
    }];
}

function generateInteractiveTemplate(config: ProjectConfig): GeneratedFile[] {
    return [{
        path: 'src/index.tsx',
        content: `import { app } from '@termuijs/quick';
import { Form, Select, Toast, ConfirmDialog } from '@termuijs/ui';

// Interactive tool with forms, selects, and toasts
app('🔧 ${config.name}')
    .rows(
        // Add your interactive components here
    )
    .run();
`,
    }];
}

function generateCliWrapperTemplate(config: ProjectConfig): GeneratedFile[] {
    return [{
        path: 'src/index.tsx',
        content: `import { app, text, logView } from '@termuijs/quick';
import { exec } from 'node:child_process';

// CLI wrapper — runs a command and displays output
const logs: string[] = [];

app('📟 ${config.name}')
    .rows(
        text('Command output will appear below'),
        logView('Output', () => logs),
    )
    .run();
`,
    }];
}
