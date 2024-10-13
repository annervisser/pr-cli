import { runCommand } from '../../shell/shell.ts';
import { CommandExecutionError } from '../../shell/command-execution-error.ts';

export async function _gum_confirm(options?: {
	prompt?: string;
	affirmativeLabel?: string;
	negativeLabel?: string;
	startOnAffirmative?: boolean;
	timeout?: number;
}): Promise<boolean> {
	const args = [];
	options?.prompt !== undefined && args.push(options.prompt);
	options?.affirmativeLabel !== undefined && args.push(`--affirmative=${options.affirmativeLabel}`);
	options?.negativeLabel !== undefined && args.push(`--negative=${options.negativeLabel}`);
	options?.timeout !== undefined && args.push(`--timeout=${options.timeout}`);

	if (options?.startOnAffirmative) {
		args.push(`--default=${options?.startOnAffirmative}`);
	}

	try {
		await runCommand('gum', 'confirm', ...args);
		return true;
	} catch (e) {
		if (e instanceof CommandExecutionError && e.code === 1) {
			return false;
		}
		throw e;
	}
}
