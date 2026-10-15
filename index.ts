import { Command } from 'commander';
import { registerGreet } from './commands/greet.ts';
import { registerSchema } from './commands/schema.ts';
import { registerSkills } from './commands/skills.ts';
import { argvWantsJson, reportError } from './lib/cli.ts';

const json = argvWantsJson();
const program = new Command();

// Settings here are inherited by every command registered below, so they must
// come before the register* calls.
program
    .name('buncli')
    .description('A simple CLI built with Bun')
    .version('0.1.0')
    .option('--json', 'one line of JSON on stdout; errors as JSON on stderr')
    .option('--non-interactive', 'never prompt; fail with a usage error when input is missing')
    .addHelpText('after', `
Examples:
  $ buncli greet Ada
  $ buncli greet Ada --json
  $ buncli greet --help

Exit codes:
  0  success
  1  runtime error
  2  usage error: bad or missing arguments, options or input

For AI agents:
  buncli skills get core   operating guide (flags, output, exit codes)
  buncli schema            every command, argument and option as JSON`)
    .showHelpAfterError('(run with --help for usage)')
    // With --json, errors are reported as JSON by reportError instead.
    .configureOutput({ writeErr: (str) => { if (!json) process.stderr.write(str); } })
    // Throw instead of calling process.exit, so reportError picks the exit code.
    .exitOverride();

registerGreet(program);
registerSchema(program);
registerSkills(program);

// No top-level await: `bun build --compile --bytecode` emits CommonJS, which doesn't support it.
program.parseAsync().catch((error: unknown) => {
    process.exitCode = reportError(error, json);
});
