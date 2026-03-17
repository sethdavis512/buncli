import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { registerStandup } from './commands/standup';

const program = new Command();

program
    .name('buncli')
    .description('A simple CLI built with Bun')
    .version('0.1.0');

program
    .command('greet')
    .description('Greet a user by name')
    .argument('[name]', 'name to greet')
    .action(async (name?: string) => {
        try {
            const greeting = name ?? await input({ message: 'Enter your name' });
            console.log(`Hello, ${greeting}!`);
        } catch (error) {
            if (error instanceof ExitPromptError) {
                process.exit(0);
            }
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

registerStandup(program);

program.parse();
