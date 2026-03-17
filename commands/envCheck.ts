import { resolve } from 'path';
import type { Command } from 'commander';

function parseEnvKeys(content: string): Set<string> {
    const keys = new Set<string>();
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const key = trimmed.split('=')[0]?.trim();
        if (key) keys.add(key);
    }
    return keys;
}

export function registerEnvCheck(program: Command): void {
    program
        .command('env-check')
        .description('Compare .env.example against .env and report missing or extra keys')
        .option('--example <path>', 'path to example env file', '.env.example')
        .option('--env <path>', 'path to env file', '.env')
        .action(async (opts: { example: string; env: string }) => {
            const examplePath = resolve(opts.example);
            const envPath = resolve(opts.env);

            const exampleFile = Bun.file(examplePath);
            const envFile = Bun.file(envPath);

            if (!(await exampleFile.exists())) {
                console.error(`Not found: ${examplePath}`);
                process.exit(1);
            }

            if (!(await envFile.exists())) {
                console.error(`Not found: ${envPath}`);
                process.exit(1);
            }

            const exampleKeys = parseEnvKeys(await exampleFile.text());
            const envKeys = parseEnvKeys(await envFile.text());

            const missing = [...exampleKeys].filter(k => !envKeys.has(k));
            const extra = [...envKeys].filter(k => !exampleKeys.has(k));

            if (missing.length === 0 && extra.length === 0) {
                console.log('✓ .env matches .env.example');
                return;
            }

            if (missing.length > 0) {
                console.log(`\nMissing from .env (${missing.length}):`);
                for (const key of missing) console.log(`  - ${key}`);
            }

            if (extra.length > 0) {
                console.log(`\nExtra in .env not in .env.example (${extra.length}):`);
                for (const key of extra) console.log(`  + ${key}`);
            }

            process.exit(1);
        });
}
