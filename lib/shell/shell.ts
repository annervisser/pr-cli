import * as log from '@std/log';
import { formatObjectForLog } from '../pr-cli/debug.ts';
import { CommandExecutionError } from './command-execution-error.ts';

export async function runCommand(command: string, ...args: string[]): Promise<void> {
	await run(command, {
		args: args,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	});
}

export async function runAndCapture(command: string, ...args: string[]): Promise<string> {
	const output = await runAndCaptureRaw(command, ...args);
	return output.trim();
}

export async function runAndCaptureRaw(command: string, ...args: string[]): Promise<string> {
	const output = await run(command, {
		args,
		stdin: 'inherit',
		stdout: 'piped',
		stderr: 'inherit',
	});

	return new TextDecoder().decode(output.stdout);
}

/**
 * Captures and returns stdout.
 * stderr is also captured and provided as part of the error in case of failure
 */
export async function runQuietly(command: string, ...args: string[]): Promise<string> {
	const output = await run(command, {
		args,
		stdin: 'null',
		stdout: 'piped',
		stderr: 'piped', // Run piped so we can print on error
	});

	return new TextDecoder().decode(output.stdout).trim();
}

async function run(command: string, options?: Deno.CommandOptions) {
	log.debug(formatCommand(command, options));
	const output = await new Deno.Command(command, options).output();
	throwErrorIfFailed(output);
	return output;
}

function formatCommand(command: string, options?: Deno.CommandOptions) {
	let message = ' $: ';
	message += [command, ...(options?.args?.map((arg) => `"${arg}"`) ?? [])].join(' ');

	if (options) {
		const { args: _, ...optionsExceptArgs } = options;
		message += ` (${formatObjectForLog(optionsExceptArgs)})`;
	}

	return message;
}

function throwErrorIfFailed(commandOutput: Deno.CommandOutput) {
	if (!commandOutput.success) {
		throw CommandExecutionError.fromCommandOutput(commandOutput);
	}
}
