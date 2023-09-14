import { log } from '../../deps.ts';

export class CommandExecutionException extends Error {
	constructor(
		public readonly code: number,
		public readonly signal?: number | Deno.Signal | null,
	) {
		let message = `Command execution failed with code ${code}`;
		if (signal) {
			message += ` (signal: ${signal})`;
		}
		super(message);
		this.name = 'CommandExecutionException';
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

export async function runVoid(command: string, ...args: string[]): Promise<void> {
	const output = await run(command, {
		args,
		stdin: 'null',
		stdout: 'null',
		stderr: 'null',
	});

	throwErrorIfFailed(output);
}

async function run(command: string, options?: Deno.CommandOptions) {
	log.debug(`Running command: ${command} ${options?.args?.join(' ')}`);
	log.debug(options);
	return await new Deno.Command(command, options).output();
}

function throwErrorIfFailed(status: Deno.CommandStatus) {
	if (!status.success) {
		throw new CommandExecutionException(status.code, status.signal);
	}
}
