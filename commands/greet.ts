import type { Command } from 'commander';
import { input } from '@inquirer/prompts';
import { ask, getContext, output } from '../lib/cli.ts';

export function registerGreet(program: Command): void {
    program
        .command('greet')
        .description('Greet someone by name')
        .argument('[name]', 'name to greet (prompted for in a terminal when omitted)')
        .addHelpText('after', `
Examples:
  $ buncli greet Ada
  $ buncli greet Ada --json
  $ buncli greet          # prompts for a name in a terminal`)
        .action(async (nameArg: string | undefined, _options: unknown, command: Command) => {
            const ctx = getContext(command);
            const name = nameArg ?? await ask(
                ctx,
                { name: 'name', hint: 'Pass it as an argument: `buncli greet <name>`.' },
                () => input({ message: 'Enter your name' }),
            );
            const greeting = `Hello, ${name}!`;
            output(ctx, { name, greeting }, greeting);
        });
}
