import { runAndCapture } from 'lib/shell/shell.ts';
import { ColorScheme } from 'lib/colors.ts';

export async function _gum_input(options?: {
	placeholder?: string;
	prompt?: string;
	defaultValue?: string;
}) {
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
