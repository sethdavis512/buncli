# Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Documentation Index

Fetch the complete documentation index at: https://bun.com/docs/llms.txt
Use this file to discover all available pages before exploring further.

## Shell

Use Bun's shell scripting API (`import { $ } from "bun"`) to run shell commands from JavaScript. It's a cross-platform bash-like shell with seamless JavaScript interop. Use `Bun.$` instead of `execa` or `child_process`.

- Cross-platform (Windows, Linux, macOS) with native builtins: `ls`, `cd`, `rm`, `echo`, `pwd`, `cat`, `touch`, `mkdir`, `which`, `mv`, `exit`, `true`, `false`, `yes`, `seq`, `dirname`, `basename`
- Template literals for execution, with automatic escaping to prevent shell injection
- Supports redirection (`<`, `>`, `2>`, `&>`, `>>`, `1>&2`, `2>&1`), pipes (`|`), command substitution (`$(...)`)
- JavaScript interop: use `Response`, `Buffer`, `ArrayBuffer`, `Blob`, `Bun.file()` as stdin/stdout/stderr

```ts
import { $ } from "bun";

// Basic usage
await $`echo "Hello World!"`;

// Read output as text
const result = await $`echo "Hello"`.text();

// Read as JSON
const data = await $`echo '{"foo": "bar"}'`.json();

// Read line-by-line
for await (let line of $`cat list.txt`.lines()) {
  console.log(line);
}

// Quiet output
await $`echo "Hello"`.quiet();

// Error handling - non-zero exits throw by default
try {
  await $`something-that-may-fail`.text();
} catch (err) {
  console.log(`Failed with code ${err.exitCode}`);
  console.log(err.stderr.toString());
}

// Disable throwing
const { exitCode } = await $`may-fail`.nothrow().quiet();

// Pipe JS objects
const response = new Response("hello");
await $`cat < ${response} | wc -w`;

// Redirect to file
await $`echo bun! > greeting.txt`;

// Redirect to buffer
const buffer = Buffer.alloc(100);
await $`echo "Hello" > ${buffer}`;

// Environment variables
await $`echo $FOO`.env({ ...process.env, FOO: "bar" });

// Working directory
await $`pwd`.cwd("/tmp");

// Global defaults
$.cwd("/tmp");
$.env({ FOO: "bar" });
$.nothrow();

// Brace expansion
await $.braces("echo {1,2,3}"); // ["echo 1", "echo 2", "echo 3"]

// Escape strings
$.escape('$(foo) "bar"'); // \$(foo) \"bar\"

// Raw (unescaped) strings
await $`echo ${{ raw: "$(date)" }}`;
```

Bun Shell can also run `.sh` files cross-platform: `bun ./script.sh`

## Inquirer.js (`@inquirer/prompts`)

Interactive CLI prompt library. Install: `bun add @inquirer/prompts`

### Available Prompts

| Prompt | Description |
|--------|-------------|
| `input` | Text input with optional validation/default |
| `select` | Single choice from a list (arrow keys) |
| `checkbox` | Multiple selections from a list |
| `confirm` | Yes/no question |
| `search` | Filterable/searchable list selection |
| `password` | Masked text input |
| `expand` | Compact selection with keyboard shortcuts |
| `editor` | Opens `$VISUAL`/`$EDITOR` for long-form input |
| `number` | Numeric input with validation |
| `rawlist` | Numbered list selection |

### Usage

```ts
import { input, select, checkbox, confirm, search, password, number } from '@inquirer/prompts';

// Basic text input
const name = await input({ message: "What's your name?" });

// Select from choices
const color = await select({
  message: 'Pick a color',
  choices: [
    { name: 'Red', value: 'red' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
  ],
});

// Multiple selection
const features = await checkbox({
  message: 'Select features',
  choices: [
    { name: 'TypeScript', value: 'ts' },
    { name: 'ESLint', value: 'eslint' },
    { name: 'Prettier', value: 'prettier' },
  ],
});

// Yes/no confirmation
const proceed = await confirm({ message: 'Continue?' });

// Password input
const secret = await password({ message: 'Enter token' });

// Number input
const port = await number({ message: 'Port number' });

// Conditional prompts
const wantEmail = await confirm({ message: 'Get notifications?' });
let email;
if (wantEmail) {
  email = await input({ message: 'Email address' });
}
```

### Context Options (second argument)

All prompts accept a second argument for I/O configuration and cancellation:

```ts
const answer = await input(
  { message: 'Enter value' },
  {
    input: process.stdin,        // custom readable stream
    output: process.stdout,      // custom writable stream
    clearPromptOnDone: true,     // clear prompt after answer
    signal: AbortSignal.timeout(5000), // timeout/cancellation
  },
);
```

### Error Handling

Ctrl+C throws `ExitPromptError`. Handle gracefully:

```ts
import { ExitPromptError } from '@inquirer/prompts';

try {
  const answer = await input({ message: 'Name?' });
} catch (error) {
  if (error instanceof ExitPromptError) {
    console.log('Goodbye!');
    process.exit(0);
  }
  throw error;
}

// Default value on timeout
const answer = await input(
  { message: 'Value (5s timeout)' },
  { signal: AbortSignal.timeout(5000) },
).catch((error) => {
  if (error.name === 'AbortPromptError') return 'default';
  throw error;
});
```

### i18n

Auto-detects locale from `LANGUAGE`, `LC_ALL`, `LC_MESSAGES`, `LANG`:

```ts
import { input, select, confirm } from '@inquirer/i18n';
// Or import a specific locale:
import { input } from '@inquirer/i18n/fr';
```

## Single-file Executable (`bun build --compile`)

Generate standalone binaries from TypeScript/JavaScript. Bundles all imports, packages, and a copy of the Bun runtime into one file.

### Basic usage

```bash
# CLI
bun build --compile ./cli.ts --outfile mycli

# Production (recommended)
bun build --compile --minify --sourcemap --bytecode ./cli.ts --outfile mycli
```

```ts
// JavaScript API
await Bun.build({
  entrypoints: ["./cli.ts"],
  compile: { outfile: "./mycli" },
  minify: true,
  sourcemap: "linked",
  bytecode: true,
});
```

### Cross-compilation

Use `--target` to compile for other platforms:

```bash
bun build --compile --target=bun-linux-x64 ./app.ts --outfile myapp
bun build --compile --target=bun-linux-arm64 ./app.ts --outfile myapp
bun build --compile --target=bun-darwin-arm64 ./app.ts --outfile myapp
bun build --compile --target=bun-darwin-x64 ./app.ts --outfile myapp
bun build --compile --target=bun-windows-x64 ./app.ts --outfile myapp
bun build --compile --target=bun-windows-arm64 ./app.ts --outfile myapp
```

Append `-baseline` for pre-2013 CPUs, `-modern` for 2013+ CPUs. Musl variants: `bun-linux-x64-musl`, `bun-linux-arm64-musl`.

### Build-time constants

```bash
bun build --compile --define BUILD_VERSION='"1.2.3"' ./cli.ts --outfile mycli
```

```ts
await Bun.build({
  entrypoints: ["./cli.ts"],
  compile: { outfile: "./mycli" },
  define: { BUILD_VERSION: JSON.stringify("1.2.3") },
});
```

### Embedding files and assets

```ts
// Embed a file — returns a path string to the embedded file
import icon from "./icon.png" with { type: "file" };
import config from "./config.json" with { type: "file" };

// Read embedded files
const bytes = await Bun.file(icon).arrayBuffer();
const data = await Bun.file(config).json();

// Embed a SQLite database (read-write in memory, changes lost on exit)
import db from "./my.db" with { type: "sqlite", embed: "true" };
db.query("select * from users LIMIT 1").get();

// List all embedded files
for (const blob of Bun.embeddedFiles) {
  console.log(`${blob.name} - ${blob.size} bytes`);
}
```

Embed directories via CLI glob patterns:

```bash
bun build --compile ./index.ts ./public/**/*.png --outfile myapp
# Disable content hash in filenames:
bun build --compile --asset-naming="[name].[ext]" ./index.ts
```

### Embedding runtime arguments

```bash
bun build --compile --compile-exec-argv="--smol --user-agent=MyBot" ./app.ts --outfile myapp
```

Override at runtime without recompiling: `BUN_OPTIONS="--cpu-prof" ./myapp`

### Full-stack executables

Import HTML files in server code to bundle frontend assets into the binary:

```ts
import { serve } from "bun";
import index from "./index.html";

serve({
  routes: {
    "/": index,
    "/api/hello": { GET: () => Response.json({ message: "Hello" }) },
  },
});
```

```bash
bun build --compile ./server.ts --outfile myapp
```

### Workers

Add worker entrypoints explicitly:

```bash
bun build --compile ./index.ts ./my-worker.ts --outfile myapp
```

```ts
new Worker("./my-worker.ts");
```

### Config autoloading

By default: `.env` and `bunfig.toml` are loaded; `tsconfig.json` and `package.json` are not.

```bash
# Enable tsconfig/package.json loading
bun build --compile --compile-autoload-tsconfig --compile-autoload-package-json ./app.ts --outfile myapp
# Disable .env/bunfig loading
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig ./app.ts --outfile myapp
```

### Code splitting

```bash
bun build --compile --splitting ./src/entry.ts --outdir ./build
```

### Windows-specific options

```ts
await Bun.build({
  entrypoints: ["./app.ts"],
  compile: {
    outfile: "./myapp",
    windows: {
      icon: "./icon.ico",
      hideConsole: true,
      title: "My App",
      publisher: "My Company",
      version: "1.0.0",
      description: "A standalone app",
      copyright: "Copyright 2024",
    },
  },
});
```

### macOS code signing

```bash
codesign --deep --force -vvvv --sign "XXXXXXXXXX" --entitlements entitlements.plist ./myapp
```

### Bun.build() compile API reference

```ts
interface CompileBuildOptions {
  target?: string;               // Cross-compilation target
  outfile?: string;              // Output path
  execArgv?: string[];           // Runtime arguments (process.execArgv)
  autoloadTsconfig?: boolean;    // default: false
  autoloadPackageJson?: boolean; // default: false
  autoloadDotenv?: boolean;      // default: true
  autoloadBunfig?: boolean;      // default: true
  windows?: {
    icon?: string;
    hideConsole?: boolean;
    title?: string;
    publisher?: string;
    version?: string;
    description?: string;
    copyright?: string;
  };
}

// Usage forms:
compile: true                    // current platform
compile: "bun-linux-x64"        // cross-compile target string
compile: { target: "bun-linux-x64", outfile: "./myapp" }  // full options
```
