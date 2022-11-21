import ProcessStatus = Deno.ProcessStatus;
import { log } from 'deps';
import RunOptions = Deno.RunOptions;

export class CommandExecutionException extends Error {
	constructor(
		public readonly code: number,
		public readonly signal?: number,
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
	const p = run({
		cmd: [command, ...args],
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	});

	const status = await p.status();
	await p.close();

	throwErrorIfFailed(status);
}

export async function runAndCapture(command: string, ...args: string[]): Promise<string> {
	const p = run({
		cmd: [command, ...args],
		stdin: 'inherit',
		stdout: 'piped',
		stderr: 'inherit',
	});

	const [status, output] = await Promise.all([
		p.status(),
		p.output(),
	]);
	await p.close();

	throwErrorIfFailed(status);

	return new TextDecoder().decode(output).trim();
}

export async function runVoid(command: string, ...args: string[]): Promise<void> {
	const p = run({
		cmd: [command, ...args],
		stdin: 'null',
		stdout: 'null',
		stderr: 'null',
	});

	const status = await p.status();
	await p.close();

	throwErrorIfFailed(status);
}

function run(opt: RunOptions) {
	log.debug(`Running command: ${opt.cmd.join(' ')}`);
	log.debug(opt);
	return Deno.run(opt);
}

function throwErrorIfFailed(status: ProcessStatus) {
	if (!status.success) {
		throw new CommandExecutionException(status.code, status.signal);
	}
}
