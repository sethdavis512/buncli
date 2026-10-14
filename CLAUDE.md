# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run index.ts                  # Run the CLI (shows help)
bun run index.ts greet Ada --json # Run a command with JSON output
bun run index.ts schema           # Print the command tree as JSON
bun test                          # Integration tests (index.test.ts)
bunx tsc --noEmit                 # Typecheck
bun run compile                   # Compile to dist/buncli
```

## Architecture

A Bun CLI template built for people and AI agents alike, on three libraries:

- **Commander:** command structure, option parsing and help text. `index.ts` configures the root `program` (global `--json` and `--non-interactive` flags, `exitOverride()`, output hooks) and then registers commands. Commands inherit those settings only if they're registered after them.
- **@inquirer/prompts:** interactive prompts, used only as a fallback when an input wasn't passed. Always call them through `ask()` from `lib/cli.ts`, never directly in an action.
- **Bun:** runtime, bundler, test runner and package manager. Use `Bun.file()` for file I/O and `import { $ } from 'bun'` for shell commands.

Layout:

```
index.ts          # Entry: global flags, register commands, parseAsync().catch(reportError)
commands/         # One file per command, each exports register<Name>(program)
lib/cli.ts        # getContext, output, ask, CliError, usageError, reportError, ExitCode
skills/*.md       # Agent guides, imported as text and compiled into the binary
index.test.ts     # Spawns the real CLI without a TTY and checks stdout/stderr/exit codes
```

## Agent-ready contract

Every command must keep these guarantees. The README's "Built for AI Agents" section explains why.

- **Every input is passable as an argument or flag.** Prompts are a fallback via `ask(ctx, { name, hint }, prompt)`, which throws a `missing_input` usage error when `ctx.interactive` is false (no TTY, `CI` set, `--json` or `--non-interactive`).
- **Results go through `output(ctx, data, text)`:** one line of JSON on stdout with `--json`, text otherwise. Nothing else goes to stdout. Diagnostics go to stderr.
- **Errors are thrown, never printed and exited.** Use `usageError(code, message, hint)` (exit 2) for bad input and `new CliError(code, message, { hint })` (exit 1) for runtime failures. `reportError()` in `lib/cli.ts` formats them and sets the exit code. Don't call `process.exit()` in commands.
- **Error codes are stable snake_case strings**, and hints name the concrete next step.
- **Help text includes examples** via `.addHelpText('after', ...)`.
- **The interface only grows.** Add commands, options and JSON fields; don't rename or repurpose them.
- **No top-level `await` in `index.ts`.** `--bytecode` builds emit CommonJS, which rejects it.

## Adding a command

1. Create `commands/<name>.ts` exporting `register<Name>(program: Command)` and call it in `index.ts`.
2. Get the context with `getContext(command)` from the action's last argument.
3. If it needs a guide beyond `--help`, add `skills/<name>.md` and an entry in the `skills` array in `commands/skills.ts`.
4. Add integration tests to `index.test.ts`: `--json` output, missing input (exit 2) and each error code.
5. `buncli schema` picks up the new command automatically.

## Key conventions

- TypeScript strict mode is enabled; avoid `any`.
- No separate build step for development; Bun runs `.ts` directly.
- Markdown imports need `with { type: 'text' }`; their type comes from `env.d.ts`.
- `@inquirer/core` is a direct dependency only for `ExitPromptError`. Keep it on the same major version that `@inquirer/prompts` uses, or the `instanceof` check fails.
