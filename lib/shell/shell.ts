import { log } from '../../deps.ts';
import { formatObjectForLog } from '../pr-cli/debug.ts';

export class CommandExecutionException extends Error {
	constructor(
		public readonly code: number,
		public readonly signal: number | Deno.Signal | null = null,
		public readonly stderr: string | null = null,
	) {
		let message = `Command execution failed with code ${code}`;
		if (signal) {
			message += ` (signal: ${signal})`;
		}
		super(message);
		this.name = 'CommandExecutionException';
	}

	static fromCommandOutput(output: Deno.CommandOutput): CommandExecutionException {
		if (output.success) {
			throw new Error('Trying to create CommandExecutionException from successfull output');
		}

		let stderr: Uint8Array | null = null;
		try {
			stderr = output.stderr;
		} catch {
			// If stderr wasn't piped, we can't get it.
		}
		return new CommandExecutionException(
			output.code,
			output.signal,
			stderr ? new TextDecoder().decode(stderr) : null,
		);
	}
}

export async function runCommand(command: string, ...args: string[]): Promise<void> {
	const output = await run(command, {
		args: args,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	});

	throwErrorIfFailed(output);
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

	throwErrorIfFailed(output);

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

	throwErrorIfFailed(output);

	return new TextDecoder().decode(output.stdout).trim();
}

async function run(command: string, options?: Deno.CommandOptions) {
	log.debug(formatCommand(command, options));
	return await new Deno.Command(command, options).output();
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
		throw CommandExecutionException.fromCommandOutput(commandOutput);
	}
}
