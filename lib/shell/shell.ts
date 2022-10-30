import ProcessStatus = Deno.ProcessStatus;

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
	const p = Deno.run({
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
	const p = Deno.run({
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
	const p = Deno.run({
		cmd: [command, ...args],
		stdin: 'null',
		stdout: 'null',
		stderr: 'null',
	});

	const status = await p.status();
	await p.close();

	throwErrorIfFailed(status);
}

function throwErrorIfFailed(status: ProcessStatus) {
	if (!status.success) {
		throw new CommandExecutionException(status.code, status.signal);
	}
}
