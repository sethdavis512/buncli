import type { Command } from 'commander';
import core from '../skills/core.md' with { type: 'text' };
import greet from '../skills/greet.md' with { type: 'text' };
import stub from '../skills/stub.md' with { type: 'text' };
import { getContext, output, usageError } from '../lib/cli.ts';

/**
 * Agent guides embedded in the binary at build time. Add a markdown file under
 * skills/ and an entry here when you add a command worth a guide.
 */
const skills = [
    { name: 'core', description: 'Operating guide: discovery, flags, output, exit codes and errors', content: core },
    { name: 'greet', description: 'Usage, inputs and errors for `buncli greet`', content: greet },
] as const;

export function registerSkills(program: Command): void {
    const command = program
        .command('skills')
        .description('Print agent guides built into this binary (start with `skills get core`)')
        .addHelpText('after', `
Examples:
  $ buncli skills                 # list guides
  $ buncli skills get core        # print the operating guide
  $ buncli skills stub > ~/.claude/skills/buncli/SKILL.md`)
        .action((_options: unknown, cmd: Command) => {
            const ctx = getContext(cmd);
            const list = skills.map(({ name, description }) => ({ name, description }));
            const text = [
                ...list.map(({ name, description }) => `${name.padEnd(8)}${description}`),
                '',
                'Run `buncli skills get <name>` to print one.',
            ].join('\n');
            output(ctx, { version: program.version(), skills: list }, text);
        });

    command
        .command('get')
        .description('Print one guide as markdown')
        .argument('<name>', 'guide name (see `buncli skills`)')
        .action((name: string, _options: unknown, cmd: Command) => {
            const skill = skills.find((s) => s.name === name);
            if (!skill) {
                throw usageError(
                    'unknown_skill',
                    `No guide named "${name}".`,
                    `Available: ${skills.map((s) => s.name).join(', ')}.`,
                );
            }
            const ctx = getContext(cmd);
            output(ctx, { name: skill.name, content: skill.content }, skill.content.trimEnd());
        });

    command
        .command('stub')
        .description('Print a SKILL.md that points an agent at `buncli skills get core`')
        .action(() => {
            process.stdout.write(stub);
        });
}
