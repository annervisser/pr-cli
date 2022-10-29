import { colors } from 'https://deno.land/x/cliffy@v0.25.4/ansi/colors.ts';
import RunOptions = Deno.RunOptions;

export class CommandExecutionException extends Error {
	constructor(
		public readonly code: number,
	) {
		super(`Command execution failed with code ${code}`);
		this.name = 'CommandExecutionException';
	}
}

export async function runCommandOrThrow(
	cmd: RunOptions['cmd'],
) {
	const result = await runCommand(cmd);

	if (result instanceof CommandExecutionException) {
		throw result;
	}
	return result;
}

export async function runCommand(
	cmd: RunOptions['cmd'],
): Promise<string | CommandExecutionException> {
	const result = await runCommandQuiet(cmd);

	if (!(result instanceof CommandExecutionException)) {
		console.log(result);
	}
	return result;
}

export async function runCommandQuiet(
	cmd: RunOptions['cmd'],
): Promise<string | CommandExecutionException> {
	const p = Deno.run({
		cmd: cmd,
		stdout: 'piped',
		stderr: 'piped',
		// @TODO is setting cwd needed?
	});

	const { success, code } = await p.status();
	if (success) {
		const output = await p.output();
		return new TextDecoder().decode(output).trim();
	} else {
		const stderr = await p.stderrOutput();
		console.error(colors.red(new TextDecoder().decode(stderr)));
		return new CommandExecutionException(code);
	}
}
