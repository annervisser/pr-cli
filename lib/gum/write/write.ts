import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';

export async function _gum_write(options: {
	width?: number;
	height?: number;
	header?: string;
	placeholder?: string;
	prompt?: string;
	showCursorLine?: boolean;
	showLineNumbers?: boolean;
	value?: string;
	charLimit?: number;
}) {
	const args = [];
	'width' in options && args.push(`--width=${options.width}`);
	'height' in options && args.push(`--height=${options.height}`);
	'header' in options && args.push(`--header=${options.header ?? ''}`);
	'placeholder' in options && args.push(`--placeholder=${options.placeholder ?? ''}`);
	'prompt' in options ? args.push(`--prompt=${options.prompt ?? ''}`) : args.push(`--prompt=`);
	'value' in options && args.push(`--value=${options.value ?? ''}`);
	options?.showCursorLine && args.push(`--show-cursor-line`);
	options?.showLineNumbers && args.push(`--show-line-numbers`);

	return await runAndCapture(
		'gum',
		'write',
		`--char-limit=${options?.charLimit ?? 0}`, // When not specified, default to no limit instead of 400
		`--line-number.foreground=${ColorScheme.primary}`,
		`--cursor-line-number.foreground=${ColorScheme.primary}`,
		`--cursor-line-number.bold`,
		`--prompt.foreground=${ColorScheme.primary}`,
		`--end-of-buffer.foreground=${ColorScheme.primaryDarker}`,
		'--base.margin=0 0 0 1',
		...args,
	);
}
