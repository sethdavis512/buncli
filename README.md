# buncli

A template for building full-featured CLI tools with Bun, Commander, and Inquirer.

## Use Cases

A shared internal CLI is one of the fastest ways to bring consistency to a fragmented team. Here are practical ways to put it to use:

- **Standardized project scaffolding** — Prompt developers through required setup steps (repo name, tech stack, environment config) so every new project starts from the same baseline instead of whoever's laptop template from two years ago.
- **Environment and service status checks** — Poll staging and production endpoints, database connections, and third-party integrations to surface outages or misconfigurations before they become support tickets.
- **Guided deployment workflows** — Walk engineers through pre-flight checks, environment selection, and confirmation steps before pushing to production, reducing the chance of a rushed deploy skipping critical steps.
- **Internal data lookups** — Query internal APIs, databases, or spreadsheets by record ID, customer name, or date range — no more digging through five dashboards to answer a straightforward question.
- **Automated release notes generation** — Pull merged PRs and commit history since the last tag and format them into a changelog, consistently, every time.
- **Onboarding automation** — New hire runs one command and gets their local environment configured: dependencies installed, `.env` files populated from a secrets manager, and seed data loaded.
- **Cross-team task automation** — Trigger repetitive multi-step workflows (cache invalidation, permission grants, feature flag toggles) that currently live in someone's personal notes or Slack history.
- **Audit and compliance reporting** — Generate point-in-time snapshots of user access, configuration state, or data exports in a consistent format for security reviews or client reporting.
- **Secrets and credential rotation** — Walk through rotating API keys or tokens across services with confirmation prompts and automatic validation that the new credentials work before the old ones are revoked.
- **Incident response runbooks** — Encode the steps engineers take during an outage (pull logs, restart services, notify stakeholders) into a guided interactive script so the playbook is actually followed under pressure.

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

Compile your CLI into a self-contained executable that embeds the Bun runtime alongside your code. The resulting binary has zero external dependencies — no Node.js, no Bun, no `node_modules` — so users can download a single file and run it immediately.

This is ideal for distributing internal tooling to teammates who aren't set up with a JavaScript runtime, shipping a CLI to end users without requiring any install steps, or deploying to CI environments where you want a predictable, hermetic tool.

```bash
bun build --compile ./index.ts --outfile mycli
./mycli --help
```

Host the binary anywhere reachable — an S3 bucket, a GitHub Release asset, or your own file server. Users download the file for their platform, make it executable (`chmod +x mycli` on macOS/Linux), and they're done.

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
