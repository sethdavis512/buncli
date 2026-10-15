import { describe, expect, it } from 'bun:test';

/**
 * Integration tests: run the real CLI the way an agent does, with no terminal
 * attached (so prompting is off), and check stdout, stderr and exit codes.
 */
async function run(...args: string[]) {
    const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/index.ts`, ...args], {
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, CI: '' },
    });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    return { stdout, stderr, exitCode };
}

describe('greet', () => {
    it('prints text by default', async () => {
        const result = await run('greet', 'Ada');
        expect(result).toEqual({ stdout: 'Hello, Ada!\n', stderr: '', exitCode: 0 });
    });

    it('prints one line of JSON with --json, before or after the command', async () => {
        for (const args of [['greet', 'Ada', '--json'], ['--json', 'greet', 'Ada']]) {
            const { stdout, exitCode } = await run(...args);
            expect(exitCode).toBe(0);
            expect(JSON.parse(stdout)).toEqual({ name: 'Ada', greeting: 'Hello, Ada!' });
        }
    });

    it('fails fast with a usage error instead of prompting without a terminal', async () => {
        const { stdout, stderr, exitCode } = await run('greet');
        expect(exitCode).toBe(2);
        expect(stdout).toBe('');
        expect(stderr).toContain('Error [missing_input]: Missing required input: name.');
        expect(stderr).toContain('Hint: Pass it as an argument');
    });

    it('reports missing input as JSON on stderr with --json', async () => {
        const { stdout, stderr, exitCode } = await run('greet', '--json');
        expect(exitCode).toBe(2);
        expect(stdout).toBe('');
        expect(JSON.parse(stderr)).toMatchObject({ error: { code: 'missing_input' } });
    });
});

describe('usage errors', () => {
    it('exits 2 on an unknown option', async () => {
        const { stderr, exitCode } = await run('greet', 'Ada', '--bogus');
        expect(exitCode).toBe(2);
        expect(stderr).toContain("unknown option '--bogus'");
    });

    it('reports an unknown command as JSON with --json', async () => {
        const { stdout, stderr, exitCode } = await run('--json', 'nope');
        expect(exitCode).toBe(2);
        expect(stdout).toBe('');
        expect(JSON.parse(stderr)).toMatchObject({ error: { code: 'unknown_command' } });
    });

    it('exits 2 with help and a reason when no command is given', async () => {
        const { stdout, stderr, exitCode } = await run();
        expect(exitCode).toBe(2);
        expect(stdout).toBe('');
        expect(stderr).toContain('Usage: buncli');
        expect(stderr).toContain('Error [no_command]: No command given.');
    });

    it('reports a missing command as JSON with --json', async () => {
        const { stdout, stderr, exitCode } = await run('--json');
        expect(exitCode).toBe(2);
        expect(stdout).toBe('');
        expect(JSON.parse(stderr)).toMatchObject({ error: { code: 'no_command' } });
    });

    it('exits 0 for --help and --version', async () => {
        const help = await run('--help');
        expect(help.exitCode).toBe(0);
        expect(help.stdout).toContain('Examples:');
        expect(help.stdout).toContain('Exit codes:');
        expect(await run('--version')).toMatchObject({ stdout: '0.1.0\n', exitCode: 0 });
    });
});

describe('schema', () => {
    it('describes commands, arguments and global options as JSON', async () => {
        const { stdout, exitCode } = await run('schema');
        expect(exitCode).toBe(0);
        const schema = JSON.parse(stdout);
        expect(schema.globalOptions.map((o: { name: string }) => o.name)).toContain('nonInteractive');
        expect(schema.commands).toContainEqual(expect.objectContaining({
            name: 'greet',
            arguments: [expect.objectContaining({ name: 'name', required: false })],
        }));
        expect(schema.exitCodes).toHaveProperty('2');
    });
});

describe('skills', () => {
    it('lists guides as JSON', async () => {
        const { stdout, exitCode } = await run('skills', '--json');
        expect(exitCode).toBe(0);
        expect(JSON.parse(stdout).skills.map((s: { name: string }) => s.name)).toEqual(['core', 'greet']);
    });

    it('prints a guide as markdown', async () => {
        const { stdout, exitCode } = await run('skills', 'get', 'core');
        expect(exitCode).toBe(0);
        expect(stdout).toStartWith('# buncli: operating guide for agents');
    });

    it('exits 2 for an unknown guide and lists the real ones', async () => {
        const { stderr, exitCode } = await run('skills', 'get', 'nope');
        expect(exitCode).toBe(2);
        expect(stderr).toContain('Available: core, greet.');
    });

    it('prints an installable SKILL.md stub', async () => {
        const { stdout, exitCode } = await run('skills', 'stub');
        expect(exitCode).toBe(0);
        expect(stdout).toStartWith('---\nname: buncli\n');
        expect(stdout).toContain('buncli skills get core');
    });
});
