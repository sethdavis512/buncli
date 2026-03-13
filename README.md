# buncli

A template for building full-featured CLI tools with Bun, Commander, and Inquirer.

## Stack

- **[Bun](https://bun.sh)** — Runtime, bundler, and package manager
- **[Commander](https://github.com/tj/commander.js)** — Command parsing, options, subcommands, and help text
- **[@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)** — Interactive prompts (input, select, confirm, checkbox, etc.)
- **TypeScript** — Type safety out of the box (Bun runs `.ts` directly)

## Setup

```bash
bun install
```

## Run

```bash
bun run index.ts
```

## Project Structure

```text
buncli/
├── index.ts          # Entry point
├── package.json
├── tsconfig.json
├── CLAUDE.md         # AI assistant instructions & Bun API reference
└── README.md
```

As your CLI grows, consider organizing into:

```text
buncli/
├── index.ts          # Entry point — parse args, register commands
├── commands/         # One file per command or command group
│   ├── init.ts
│   ├── build.ts
│   └── deploy.ts
├── lib/              # Shared utilities
│   ├── config.ts     # Read/write config files
│   ├── prompts.ts    # Reusable prompt flows
│   └── output.ts     # Formatted output helpers
├── package.json
└── tsconfig.json
```

## Building a CLI

### 1. Define Commands with Commander

```ts
import { Command } from 'commander';

const program = new Command();

program
  .name('mycli')
  .description('What your tool does')
  .version('1.0.0');

program
  .command('greet')
  .description('Greet a user')
  .argument('<name>', 'name to greet')
  .option('-s, --shout', 'uppercase the greeting')
  .action((name, options) => {
    const greeting = `Hello, ${name}!`;
    console.log(options.shout ? greeting.toUpperCase() : greeting);
  });

program.parse();
```

### 2. Add Interactive Prompts

Use `@inquirer/prompts` when your command needs user input:

```ts
import {
  input,     // free-form text
  select,    // pick one from a list
  checkbox,  // pick multiple from a list
  confirm,   // yes/no
  password,  // masked text
  number,    // numeric input with validation
  search,    // filterable list (async search supported)
  expand,    // compact choice with shortcut keys
  editor,    // opens $VISUAL/$EDITOR for long text
  rawlist,   // numbered list (type a number to choose)
} from '@inquirer/prompts';

// Text input with validation
const name = await input({
  message: 'Project name',
  validate: (value) => value.length > 0 || 'Name is required',
});

// Single choice from a list (arrow keys to navigate)
const framework = await select({
  message: 'Pick a framework',
  choices: [
    { name: 'React', value: 'react' },
    { name: 'Vue', value: 'vue' },
    { name: 'Svelte', value: 'svelte' },
  ],
});

// Multiple selection (space to toggle, enter to submit)
const features = await checkbox({
  message: 'Select features',
  choices: [
    { name: 'TypeScript', value: 'ts', checked: true },
    { name: 'Linting', value: 'lint' },
    { name: 'Testing', value: 'test' },
  ],
});

// Yes/no confirmation
const proceed = await confirm({ message: 'Create project?' });

// Masked password input
const token = await password({ message: 'API token' });

// Numeric input
const port = await number({ message: 'Port', default: 3000 });

// Searchable list — great for long lists, supports async sources
const dep = await search({
  message: 'Search packages',
  source: async (term) => {
    if (!term) return [];
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${term}&size=5`);
    const data = await res.json();
    return data.objects.map((o: any) => ({ name: o.package.name, value: o.package.name }));
  },
});

// Conditional prompts — ask follow-ups based on previous answers
const wantDeploy = await confirm({ message: 'Set up deployment?' });
if (wantDeploy) {
  const provider = await select({
    message: 'Deploy target',
    choices: [
      { name: 'Railway', value: 'railway' },
      { name: 'Fly.io', value: 'fly' },
      { name: 'Docker', value: 'docker' },
    ],
  });
}
```

### 3. Run Shell Commands

Use Bun Shell for system operations:

```ts
import { $ } from 'bun';

// Run a command and get output
const branch = await $`git branch --show-current`.text();

// Pipe commands
await $`cat package.json | jq '.dependencies'`;

// Handle errors
const { exitCode } = await $`git status`.nothrow().quiet();
if (exitCode !== 0) {
  console.error('Not a git repository');
  process.exit(1);
}
```

### 4. Read and Write Files

```ts
// Read
const pkg = await Bun.file('package.json').json();

// Write
await Bun.write('config.json', JSON.stringify(config, null, 2));

// Check existence
const exists = await Bun.file('config.json').exists();
```

### 5. Handle Errors Gracefully

```ts
import { ExitPromptError } from '@inquirer/prompts';

try {
  // ... your CLI logic
} catch (error) {
  if (error instanceof ExitPromptError) {
    // User pressed Ctrl+C during a prompt
    process.exit(0);
  }
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}
```

### 6. Add Color and Formatting

Bun supports ANSI escape codes natively. For convenience, use a package like `chalk` or write simple helpers:

```ts
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

console.log(green('✓'), bold('Project created'));
console.log(red('✗'), 'Something went wrong');
console.log(dim('hint: run `mycli --help` for usage'));
```

## Compile to a Standalone Binary

Ship your CLI as a single executable with no dependencies:

```bash
# Development
bun build --compile ./index.ts --outfile mycli

# Production (smaller, faster startup)
bun build --compile --minify --sourcemap --bytecode ./index.ts --outfile mycli
```

Cross-compile for other platforms:

```bash
bun build --compile --target=bun-linux-x64 ./index.ts --outfile mycli
bun build --compile --target=bun-darwin-arm64 ./index.ts --outfile mycli
bun build --compile --target=bun-windows-x64 ./index.ts --outfile mycli
```

## Making it Installable

### As an npm package

Add a `bin` field to `package.json`:

```json
{
  "name": "mycli",
  "bin": {
    "mycli": "./index.ts"
  }
}
```

Then users can install with:

```bash
bun install -g mycli
```

### As a standalone binary

Distribute the compiled binary directly. Users just download and run it — no runtime needed.

## Quick Reference

| Task | How |
|------|-----|
| Parse commands & options | `commander` — `program.command().option().action()` |
| Interactive prompts | `@inquirer/prompts` — `input`, `select`, `confirm`, `checkbox` |
| Run shell commands | `import { $ } from 'bun'` — `` await $`cmd` `` |
| Read files | `await Bun.file('path').text()` or `.json()` |
| Write files | `await Bun.write('path', content)` |
| Environment variables | `process.env.VAR` (Bun loads `.env` automatically) |
| Compile to binary | `bun build --compile ./index.ts --outfile mycli` |
| Cross-compile | `--target=bun-{linux,darwin,windows}-{x64,arm64}` |
