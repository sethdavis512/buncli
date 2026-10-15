# buncli

A template for building CLI tools with Bun, Commander and Inquirer that work equally well for people at a terminal and for AI agents.

> [!TIP]
> This is a GitHub template repository. Click **Use this template** to start a new
> CLI from it, or clone it directly: `git clone https://github.com/sethdavis512/buncli.git`

## Use Cases

A shared internal CLI is one of the fastest ways to bring consistency to a fragmented team. Here are practical ways to put it to use:

- **Standardized project scaffolding:** Prompt developers through required setup steps (repo name, tech stack, environment config) so every new project starts from the same baseline instead of whoever's laptop template from two years ago.
- **Environment and service status checks:** Poll staging and production endpoints, database connections, and third-party integrations to surface outages or misconfigurations before they become support tickets.
- **Guided deployment workflows:** Walk engineers through pre-flight checks, environment selection, and confirmation steps before pushing to production, reducing the chance of a rushed deploy skipping critical steps.
- **Internal data lookups:** Query internal APIs, databases, or spreadsheets by record ID, customer name, or date range, with no more digging through five dashboards to answer a straightforward question.
- **Automated release notes generation:** Pull merged PRs and commit history since the last tag and format them into a changelog, consistently, every time.
- **Onboarding automation:** A new hire runs one command and gets their local environment configured: dependencies installed, `.env` files populated from a secrets manager, and seed data loaded.
- **Cross-team task automation:** Trigger repetitive multi-step workflows (cache invalidation, permission grants, feature flag toggles) that currently live in someone's personal notes or Slack history.
- **Audit and compliance reporting:** Generate point-in-time snapshots of user access, configuration state, or data exports in a consistent format for security reviews or client reporting.
- **Secrets and credential rotation:** Walk through rotating API keys or tokens across services with confirmation prompts and automatic validation that the new credentials work before the old ones are revoked.
- **Incident response runbooks:** Encode the steps engineers take during an outage (pull logs, restart services, notify stakeholders) into a guided interactive script so the playbook is actually followed under pressure.

Every one of these is also something you'll want an AI agent to run for you. See [Built for AI Agents](#built-for-ai-agents).

## Stack

- **[Bun](https://bun.sh):** runtime, bundler, test runner and package manager
- **[Commander](https://github.com/tj/commander.js):** command parsing, options, subcommands and help text
- **[@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js):** interactive prompts (input, select, confirm, checkbox, etc.)
- **TypeScript:** type safety out of the box (Bun runs `.ts` directly)

## Setup

```bash
bun install
```

## Run

```bash
bun run index.ts                  # Show help
bun run index.ts greet            # Prompts for a name in a terminal
bun run index.ts greet Ada --json # {"name":"Ada","greeting":"Hello, Ada!"}
bun run index.ts schema           # The whole interface as JSON
bun run index.ts skills get core  # The agent operating guide
```

## Scripts

| Script | What it does |
| ------ | ----- |
| `bun start` | Run the CLI (`bun run index.ts`) |
| `bun test` | Run the integration tests in `index.test.ts` |
| `bun run compile` | Compile a standalone binary to `dist/buncli` |
| `bun run compile:all` | Cross-compile binaries for Linux, macOS, and Windows |
| `bun run compile:{darwin,linux,windows}-{x64,arm64}` | Compile a single platform target |

## Project Structure

```text
buncli/
├── index.ts          # Entry: global flags, error handling, registers commands
├── index.test.ts     # Integration tests that run the real CLI like an agent would
├── commands/         # One file per command, each exports register<Name>(program)
│   ├── greet.ts      # Example command: argument with prompt fallback, --json output
│   ├── schema.ts     # Prints the command tree as JSON
│   └── skills.ts     # Prints agent guides embedded in the binary
├── lib/
│   └── cli.ts        # Context (--json, interactivity), output, errors, exit codes
├── skills/           # Markdown guides for agents, compiled into the binary
│   ├── core.md       # Operating guide: flags, output, exit codes, errors
│   ├── greet.md      # Per-command guide
│   └── stub.md       # SKILL.md printed by `buncli skills stub`
├── env.d.ts          # Types for importing .md files as text
├── package.json
├── tsconfig.json
├── CLAUDE.md         # Instructions for AI assistants working on this repo
└── README.md
```

## Built for AI Agents

Coding agents (Claude Code, Codex, Cursor and others) are now major users of CLIs. They call commands from a shell, read stdout and stderr, and branch on exit codes. A good `--help` page is the foundation, but it isn't enough. An agent can't answer a prompt, can't tell an error printed to stdout from a result, and will burn tokens guessing flags.

This template builds in the patterns that agent-friendly CLIs have converged on. A person at a terminal still gets prompts and readable output; an agent gets structure.

### 1. The CLI teaches the agent how to use it

Agent instructions ship inside the binary, so they always match the installed version. This is the pattern [agent-browser](https://agent-browser.dev/skills) uses.

```bash
buncli skills                  # list guides
buncli skills get core         # operating guide: flags, output, exit codes, errors
buncli skills get greet        # per-command guide
```

The guides are markdown files in `skills/`, imported as text (`with { type: 'text' }`) and inlined by `bun build --compile`. Editing a guide and rebuilding is all it takes to update every agent that uses the new binary.

### 2. A thin skill points the agent at the CLI

Agents only find a tool they've been told about. `buncli skills stub` prints a short `SKILL.md` that names the tool and tells the agent to run `buncli skills get core` first. It deliberately holds no command reference, so it never goes stale.

```bash
# Claude Code, for one user
mkdir -p ~/.claude/skills/buncli
buncli skills stub > ~/.claude/skills/buncli/SKILL.md

# Or for one repository, checked in so the whole team gets it
mkdir -p .claude/skills/buncli
buncli skills stub > .claude/skills/buncli/SKILL.md
```

For agents without skills support, paste the stub's body into `AGENTS.md` or the agent's equivalent instructions file.

### 3. The interface is machine-readable

`buncli schema` prints every command, argument and option as JSON, plus the exit codes and the error shape. It's generated from Commander's command tree, so it can't drift from the real interface, and it needs no config, auth or network.

```bash
buncli schema
```

```json
{
  "name": "buncli",
  "version": "0.1.0",
  "globalOptions": [{ "flags": "--json", "name": "json", "takesValue": false, ... }],
  "commands": [
    {
      "name": "greet",
      "usage": "[options] [name]",
      "arguments": [{ "name": "name", "required": false, "variadic": false, ... }],
      ...
    }
  ],
  "exitCodes": { "0": "success", "1": "runtime error", "2": "usage error: ..." }
}
```

This closes the main gap between CLIs and MCP servers: an MCP server lists its tools, and now so does the CLI, without loading anything into the agent's context until it asks.

### 4. Output an agent can parse

- `--json` prints the result as one line of JSON on stdout. It works before or after the command name.
- Results go to stdout. Errors, hints and prompts go to stderr. A failed command leaves stdout empty.
- Text output has no color or spinners, so piping it never produces escape codes. If you add color, skip it when `process.stdout.isTTY` is false or `NO_COLOR` is set.

### 5. Never get stuck on a prompt

Commands accept every input as an argument or flag and fall back to a prompt only when a person can answer it. Prompting is off when any of these are true:

- `--non-interactive` is passed
- `--json` is passed (a prompt would corrupt the JSON)
- stdin or stdout is not a terminal, which covers agents, pipes and cron
- the `CI` environment variable is set

With prompting off, a missing input fails right away with exit code 2 and a hint naming the argument to pass, instead of hanging forever.

### 6. Errors say what to do next

Every error has a stable `code` to branch on, a `message`, and usually a `hint` with the fix. With `--json` it's one line on stderr:

```bash
buncli greet --json
```

```json
{"error":{"code":"missing_input","message":"Missing required input: name.","hint":"Pass it as an argument: `buncli greet <name>`."}}
```

Without `--json`, the same error is human-readable:

```text
Error [missing_input]: Missing required input: name.
Hint: Pass it as an argument: `buncli greet <name>`.
```

Unknown commands and options are hard failures, never guesses.

### 7. Exit codes are a contract

| Code | Meaning | Agent should |
| --- | --- | --- |
| 0 | Success | Parse stdout |
| 1 | Runtime error | Read the error; retry only if the cause was external |
| 2 | Usage error: bad or missing arguments, options or input | Fix the command line; don't retry unchanged |

A command never prints an error and exits 0.

### Checklist for every new command

1. Put it in `commands/<name>.ts` as `register<Name>(program)` and call it from `index.ts`.
2. Accept every input as an argument or flag. Wrap any prompt in `ask()` so it fails cleanly when nobody can answer.
3. Print the result with `output(ctx, data, text)`: one JSON object for `--json`, readable text otherwise.
4. Throw `usageError()` for bad input and `CliError` for runtime failures, each with a `hint`.
5. Add copy-pasteable examples with `.addHelpText('after', ...)`.
6. For anything destructive, require an explicit `--yes` flag in non-interactive mode, and consider `--dry-run`.
7. If the command needs more explanation than `--help` can hold, add `skills/<name>.md` and register it in `commands/skills.ts`.
8. Add cases to `index.test.ts` for `--json` output, missing input (exit 2) and errors.
9. Keep the contract stable: add commands, options and JSON fields, but don't rename or repurpose them.

### Further reading

- [Arcjet: Designing a CLI for AI agents](https://blog.arcjet.com/designing-a-cli-for-ai-agents/)
- [Speakeasy: Making your CLI agent-friendly](https://www.speakeasy.com/blog/engineering-agent-friendly-cli)
- [nerveband/cli-best-practices](https://github.com/nerveband/cli-best-practices)
- [Writing CLI skills](https://github.com/nickolasclarke/writing-cli-skills)
- [agent-browser skills](https://agent-browser.dev/skills)

## Building a CLI

### 1. Define Commands with Commander

Each command lives in its own file and registers itself on the root program. Global settings in `index.ts` (`--json`, `--non-interactive`, error handling) are inherited automatically.

```ts
// commands/deploy.ts
import type { Command } from 'commander';
import { getContext, output } from '../lib/cli.ts';

export function registerDeploy(program: Command): void {
  program
    .command('deploy')
    .description('Deploy a service')
    .argument('<service>', 'service to deploy')
    .option('-e, --env <env>', 'target environment', 'staging')
    .addHelpText('after', `
Examples:
  $ buncli deploy api --env production --json`)
    .action((service: string, options: { env: string }, command: Command) => {
      const ctx = getContext(command);
      // ... do the work
      output(ctx, { service, env: options.env, status: 'deployed' }, `Deployed ${service} to ${options.env}`);
    });
}
```

```ts
// index.ts
import { registerDeploy } from './commands/deploy.ts';
registerDeploy(program);
```

### 2. Add Interactive Prompts

Use `@inquirer/prompts` when a person can fill in what's missing, and wrap the call in `ask()` so agents and scripts get a usage error instead of a hung prompt:

```ts
import { input } from '@inquirer/prompts';
import { ask, getContext } from '../lib/cli.ts';

const ctx = getContext(command);
const name = options.name ?? await ask(
  ctx,
  { name: '--name', hint: 'Pass it with `--name <name>`.' },
  () => input({ message: 'Project name' }),
);
```

The prompts available:

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

// Searchable list: great for long lists, supports async sources
const dep = await search({
  message: 'Search packages',
  source: async (term) => {
    if (!term) return [];
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${term}&size=5`);
    const data = (await res.json()) as { objects: { package: { name: string } }[] };
    return data.objects.map((o) => ({ name: o.package.name, value: o.package.name }));
  },
});

// Conditional prompts: ask follow-ups based on previous answers
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

For a confirmation on a destructive action, take a `--yes` flag and only prompt when it's missing:

```ts
const confirmed = options.yes || await ask(
  ctx,
  { name: '--yes', hint: 'Pass --yes to confirm.' },
  () => confirm({ message: `Delete ${service}?` }),
);
```

### 3. Run Shell Commands

Use Bun Shell for system operations:

```ts
import { $ } from 'bun';
import { CliError } from '../lib/cli.ts';

// Run a command and get output
const branch = await $`git branch --show-current`.text();

// Pipe commands
await $`cat package.json | jq '.dependencies'`;

// Handle errors
const { exitCode } = await $`git status`.nothrow().quiet();
if (exitCode !== 0) {
  throw new CliError('not_a_repo', 'Not a git repository.', { hint: 'Run this inside a git checkout.' });
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

Throw instead of calling `process.exit()`. `index.ts` catches everything and `reportError()` in `lib/cli.ts` prints it (as JSON with `--json`) and sets the exit code:

```ts
import { CliError, usageError } from '../lib/cli.ts';

// The caller passed something wrong: exit code 2
throw usageError('invalid_env', `Unknown environment "${env}".`, 'Use one of: staging, production.');

// Something failed at runtime: exit code 1
throw new CliError('deploy_failed', 'The deploy API returned 503.', { hint: 'Check status.example.com and retry.' });
```

`reportError()` also handles Commander's parse errors (exit 2), `--help` and `--version` (exit 0), Ctrl+C during a prompt (inquirer's `ExitPromptError`, exit 0) and unexpected errors (exit 1).

### 6. Add Color and Formatting

Bun supports ANSI escape codes natively. Only color output for a terminal, so agents and pipes get clean text:

```ts
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

const bold = paint(1);
const green = paint(32);
const red = paint(31);
const dim = paint(2);

console.log(green('✓'), bold('Project created'));
console.error(red('✗'), 'Something went wrong');
console.error(dim('hint: run `mycli --help` for usage'));
```

## Testing

`index.test.ts` runs the real CLI with no terminal attached, the way an agent would, and checks stdout, stderr and exit codes:

```bash
bun test
```

Add cases there for each new command's `--json` output and failure modes.

## Compile to a Standalone Binary

Ship your CLI as a single executable with no dependencies. The `skills/` guides are compiled in too.

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

> [!NOTE]
> `--bytecode` builds compile to CommonJS, which doesn't allow top-level `await`. Keep `index.ts` free of it (it uses `program.parseAsync().catch(...)`).

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

Compile your CLI into a self-contained executable that embeds the Bun runtime alongside your code. The resulting binary has zero external dependencies (no Node.js, no Bun, no `node_modules`), so users can download a single file and run it immediately.

This is ideal for distributing internal tooling to teammates who aren't set up with a JavaScript runtime, shipping a CLI to end users without requiring any install steps, or deploying to CI environments where you want a predictable, hermetic tool.

```bash
bun build --compile ./index.ts --outfile mycli
./mycli --help
```

Host the binary anywhere reachable: an S3 bucket, a GitHub Release asset, or your own file server. Users download the file for their platform, make it executable (`chmod +x mycli` on macOS/Linux), and they're done. Then have them install the agent skill with `mycli skills stub` (see [Built for AI Agents](#2-a-thin-skill-points-the-agent-at-the-cli)).

## Quick Reference

| Task | How |
| ------ | ----- |
| Add a command | `commands/<name>.ts` exporting `register<Name>(program)`, called from `index.ts` |
| Parse commands & options | `commander`: `program.command().option().action()` |
| Interactive prompts | `@inquirer/prompts` (`input`, `select`, `confirm`, `checkbox`) wrapped in `ask()` |
| Print a result | `output(ctx, data, text)` from `lib/cli.ts` |
| Fail with a hint | `throw usageError(code, message, hint)` or `throw new CliError(...)` |
| Describe the CLI for agents | `buncli schema` |
| Teach agents the CLI | `skills/*.md`, served by `buncli skills get <name>` |
| Install the agent skill | `buncli skills stub > ~/.claude/skills/buncli/SKILL.md` |
| Run shell commands | `import { $ } from 'bun'`, then `` await $`cmd` `` |
| Read files | `await Bun.file('path').text()` or `.json()` |
| Write files | `await Bun.write('path', content)` |
| Environment variables | `process.env.VAR` (Bun loads `.env` automatically) |
| Test | `bun test` |
| Compile to binary | `bun build --compile ./index.ts --outfile mycli` |
| Cross-compile | `--target=bun-{linux,darwin,windows}-{x64,arm64}` |

## License

[MIT](LICENSE) © Seth Davis
