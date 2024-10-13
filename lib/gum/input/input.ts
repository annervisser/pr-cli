import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';
import { colors } from '@cliffy/ansi/colors';

export async function _gum_input(options?: {
	placeholder?: string;
	prompt?: string;
	defaultValue?: string;
	characterLimit?: number;
}): Promise<string> {
	if (options?.prompt && options?.defaultValue) {
		options.prompt += colors.dim.white('(Ctrl+U to clear) ');
	}

	const args = [];
	options?.placeholder && args.push(`--placeholder=${options.placeholder}`);
	options?.prompt && args.push(`--prompt=${options.prompt}`);
	options?.characterLimit && args.push(`--char-limit=${options.characterLimit}`);
	options?.defaultValue && args.push(`--value=${options.defaultValue}`);

	const width = Math.min(80, options?.characterLimit ?? Number.POSITIVE_INFINITY);

	return await runAndCapture(
		'gum',
		'input',
		`--width=${width}`,
		`--prompt.foreground=${ColorScheme.primary}`,
		...args,
	);
}
