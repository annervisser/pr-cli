export class CommandExecutionError extends Error {
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
		this.name = 'CommandExecutionError';
	}

	static fromCommandOutput(output: Deno.CommandOutput): CommandExecutionError {
		if (output.success) {
			throw new Error('Trying to create CommandExecutionError from successfully output');
		}

		let stderr: Uint8Array | null = null;
		try {
			stderr = output.stderr;
		} catch {
			// If stderr wasn't piped, we can't get it.
		}
		return new CommandExecutionError(
			output.code,
			output.signal,
			stderr ? new TextDecoder().decode(stderr) : null,
		);
	}
}
