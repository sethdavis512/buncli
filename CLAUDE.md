# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run index.ts          # Run the CLI
bun run index.ts greet    # Run the greet command
bun test                  # Run tests
bun build --compile ./index.ts --outfile buncli  # Compile to standalone binary
```

## Architecture

This is a single-file CLI template (`index.ts`) built on three libraries:

- **Commander** — command/subcommand structure, option parsing, and auto-generated help text. The `program` object is the root; subcommands are registered with `.command().action()`.
- **@inquirer/prompts** — interactive prompts used inside command actions when arguments aren't provided. Always wrap prompt calls in try/catch and handle `ExitPromptError` (thrown on Ctrl+C) with a clean `process.exit(0)`.
- **Bun** — runtime, bundler, and package manager. Use `Bun.file()` for file I/O, `import { $ } from 'bun'` for shell commands.

### Suggested structure as the CLI grows

```
index.ts          # Entry: create program, register commands, call program.parse()
commands/         # One file per command, each exports a function that takes a Command
lib/              # Shared utilities (config, prompts, formatting)
```

## Key conventions

- Commands should accept optional arguments and fall back to interactive prompts when the argument is missing (see the `greet` command pattern).
- TypeScript strict mode is enabled; avoid `any`.
- No separate build step for development — Bun runs `.ts` directly.
