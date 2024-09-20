import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';
import { colors } from '@cliffy/ansi/colors';

export async function _gum_input(options?: {
	placeholder?: string;
	prompt?: string;
	defaultValue?: string;
}): Promise<string> {
	if (options?.prompt && options?.defaultValue) {
		options.prompt += colors.dim.white('(Ctrl+U to clear) ');
	}

	const args = [];
	options?.placeholder && args.push(`--placeholder=${options.placeholder}`);
	options?.prompt && args.push(`--prompt=${options.prompt}`);
	options?.defaultValue && args.push(`--value=${options.defaultValue}`);

	return await runAndCapture(
		'gum',
		'input',
		'--width=80',
		`--prompt.foreground=${ColorScheme.primary}`,
		...args,
	);
}
