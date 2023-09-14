import { runAndCaptureRaw, runCommand } from '../../shell/shell.ts';

interface GumStyleOptions {
	// Colors
	background?: number | string;
	foreground?: number | string;

	// Border
	border?: 'none' | 'hidden' | 'normal' | 'rounded' | 'thick' | 'double';
	'border-background'?: number | string;
	'border-foreground'?: number | string;

	// Layout
	align?: 'left' | 'center' | 'right' | 'bottom' | 'middle' | 'top';
	height?: number;
	width?: number;
	margin?: number | [number, number];
	padding?: number | [number, number];

	// Format
	bold?: true;
	faint?: true;
	italic?: true;
	strikethrough?: true;
	underline?: true;
}

function convertOptions(options: GumStyleOptions) {
	const args: string[] = [];
	for (let [key, value] of Object.entries(options)) {
		if (['margin', 'padding'].includes(key) && Array.isArray(value)) {
			value = value.join(' ');
		}

		if (typeof value === 'boolean') {
			args.push(`--${key}`);
		} else if (typeof value === 'string' || typeof value === 'number') {
			args.push(`--${key}=${value}`);
		} else {
			throw new Error(`Invalid option value "${value}" for key "${key}"`);
		}
	}
	return args;
}

/** @see https://github.com/charmbracelet/gum/blob/main/style/options.go */
export async function _gum_style(lines: string[], options?: GumStyleOptions) {
	const args = convertOptions(options ?? {});

	await runCommand('gum', 'style', ...args, ...lines);
}

/** @see https://github.com/charmbracelet/gum/blob/main/style/options.go */
export async function _gum_style_to_string(lines: string[], options?: GumStyleOptions) {
	const args = convertOptions(options ?? {});

	return await runAndCaptureRaw('gum', 'style', ...args, ...lines);
}
