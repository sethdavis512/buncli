import { CommanderError, type Command } from 'commander';
import { ExitPromptError } from '@inquirer/core';

/**
 * Exit codes are part of the CLI's contract. Agents and scripts branch on
 * them, so never print an error and exit 0.
 */
export const ExitCode = {
    Ok: 0,
    Error: 1,
    Usage: 2,
} as const;

/** Global flags registered on the root program in index.ts. */
type GlobalOptions = {
    json?: boolean;
    nonInteractive?: boolean;
};

export type Context = {
    /** Print results as one line of JSON on stdout. */
    json: boolean;
    /** Prompting is allowed: a person is at a terminal and no flag or env var forbids it. */
    interactive: boolean;
};

/**
 * Read global flags and the environment for a running command.
 * `--json` implies non-interactive, since a prompt on stdout would corrupt the JSON.
 */
export function getContext(command: Command): Context {
    const { json = false, nonInteractive = false } = command.optsWithGlobals<GlobalOptions>();
    const isTerminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const interactive = !json && !nonInteractive && !process.env.CI && isTerminal;
    return { json, interactive };
}

/**
 * True when `--json` is anywhere on the command line. Used before or after
 * Commander parses (for example, while reporting a parse error).
 */
export function argvWantsJson(argv: readonly string[] = process.argv): boolean {
    return argv.includes('--json');
}

/**
 * An error the user or agent can act on: a stable `code` to branch on,
 * a human `message`, and a `hint` naming the next step.
 */
export class CliError extends Error {
    readonly code: string;
    readonly exitCode: number;
    readonly hint?: string;

    constructor(code: string, message: string, options: { exitCode?: number; hint?: string } = {}) {
        super(message);
        this.name = 'CliError';
        this.code = code;
        this.exitCode = options.exitCode ?? ExitCode.Error;
        this.hint = options.hint;
    }
}

/** A mistake in how the CLI was called (missing input, bad value). Exits 2. */
export function usageError(code: string, message: string, hint?: string): CliError {
    return new CliError(code, message, { exitCode: ExitCode.Usage, hint });
}

/** Print a command's result: JSON on stdout with `--json`, otherwise the text form. */
export function output(ctx: Context, data: unknown, text: string): void {
    console.log(ctx.json ? JSON.stringify(data) : text);
}

/**
 * Get input that wasn't passed as an argument or flag. Prompts when a person
 * is at a terminal; otherwise fails fast with a usage error that says how to
 * pass the value, instead of hanging on a prompt nobody can answer.
 */
export async function ask<T>(
    ctx: Context,
    missing: { name: string; hint: string },
    prompt: () => Promise<T>,
): Promise<T> {
    if (!ctx.interactive) {
        throw usageError('missing_input', `Missing required input: ${missing.name}.`, missing.hint);
    }
    return prompt();
}

/** Turn `commander.unknownOption` into `unknown_option`. */
function commanderCode(code: string): string {
    return code
        .replace(/^commander\./, '')
        .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Report any error thrown while parsing or running a command and return the
 * exit code. With `--json`, errors are one line of JSON on stderr:
 * `{"error":{"code":"...","message":"...","hint":"..."}}`.
 */
export function reportError(error: unknown, json: boolean): number {
    if (error instanceof ExitPromptError) {
        // Ctrl+C during a prompt is a deliberate exit, not a failure.
        return ExitCode.Ok;
    }

    if (error instanceof CommanderError) {
        // --help and --version also arrive here (exitCode 0) because of exitOverride().
        if (error.exitCode === 0) return ExitCode.Ok;
        if (json) {
            const message = error.code === 'commander.help'
                ? 'No command given.'
                : error.message.replace(/^error: /, '');
            writeJsonError(commanderCode(error.code), message, 'Run `buncli schema` to list commands, arguments and options.');
        }
        // Without --json, Commander has already printed the error and a help hint.
        return ExitCode.Usage;
    }

    if (error instanceof CliError) {
        if (json) {
            writeJsonError(error.code, error.message, error.hint);
        } else {
            console.error(`Error: ${error.message}`);
            if (error.hint) console.error(`Hint: ${error.hint}`);
        }
        return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (json) {
        writeJsonError('internal_error', message);
    } else {
        console.error(`Error: ${message}`);
    }
    return ExitCode.Error;
}

function writeJsonError(code: string, message: string, hint?: string): void {
    console.error(JSON.stringify({ error: { code, message, ...(hint && { hint }) } }));
}
