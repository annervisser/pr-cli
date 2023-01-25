import { CommandExecutionException, runCommand } from '../../shell/shell.ts';

export async function _gum_confirm(options?: {
	prompt?: string;
	affirmativeLabel?: string;
	negativeLabel?: string;
	startOnAffirmative?: boolean;
	timeout?: number;
}): Promise<boolean> {
	const args = [];
	options?.prompt && args.push(options.prompt);
	options?.affirmativeLabel && args.push(`--affirmative=${options.affirmativeLabel}`);
	options?.negativeLabel && args.push(`--negative=${options.negativeLabel}`);
	options?.timeout && args.push(`--timeout=${options.timeout}`);

	if (options?.startOnAffirmative) {
		args.push(`--default=${options?.startOnAffirmative}`);
	}

	try {
		await runCommand('gum', 'confirm', ...args);
		return true;
	} catch (e) {
		if (e instanceof CommandExecutionException && e.code === 1) {
			return false;
		}
		throw e;
	}
}
