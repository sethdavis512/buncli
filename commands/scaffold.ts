import { input, select } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { join } from 'path';
import type { Command } from 'commander';

type FileType = 'component' | 'test' | 'util';

function componentTemplate(name: string): string {
    return `interface ${name}Props {}

export function ${name}({}: ${name}Props) {
    return <div>${name}</div>;
}
`;
}

function testTemplate(name: string): string {
    return `import { describe, expect, test } from 'bun:test';
import { ${name} } from './${name}';

describe('${name}', () => {
    test('works', () => {
        expect(true).toBe(true);
    });
});
`;
}

function utilTemplate(name: string): string {
    return `export function ${name}() {
    // TODO: implement
}
`;
}

const templates: Record<FileType, { template: (name: string) => string; ext: string }> = {
    component: { template: componentTemplate, ext: 'tsx' },
    test: { template: testTemplate, ext: 'test.ts' },
    util: { template: utilTemplate, ext: 'ts' },
};

export function registerScaffold(program: Command): void {
    program
        .command('scaffold')
        .description('Scaffold a boilerplate file from a template')
        .action(async () => {
            try {
                const fileType = await select<FileType>({
                    message: 'File type:',
                    choices: [
                        { name: 'Component (React + TypeScript)', value: 'component' },
                        { name: 'Test (Bun test runner)', value: 'test' },
                        { name: 'Util (TypeScript function)', value: 'util' },
                    ],
                });

                const name = await input({
                    message: 'Name:',
                    validate: (val) => val.trim().length > 0 || 'Name is required',
                });

                const { ext, template } = templates[fileType];
                const defaultDest = fileType === 'component' ? 'src/components' : 'src';

                const dest = await input({
                    message: 'Destination directory:',
                    default: defaultDest,
                });

                const filename = `${name}.${ext}`;
                const filepath = join(dest, filename);
                const content = template(name);

                await Bun.write(filepath, content);

                console.log(`\nCreated ${filepath}`);
            } catch (error) {
                if (error instanceof ExitPromptError) {
                    process.exit(0);
                }
                throw error;
            }
        });
}
