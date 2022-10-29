import { CommandExecutionException } from '../shell/shell.ts';

// TODO: refactor this code to fix half reuse of gum() function
// TODO: always call p.close()

export async function chooseOne(options: string[]): Promise<string[]> {
	return await choose(options, false);
}

export async function chooseMultiple(options: string[]): Promise<string[]> {
	return await choose(options, true);
}

async function choose(
	options: string[],
	multiselect: boolean,
): Promise<string[]> {
	const limit = multiselect ? '--no-limit' : '--limit=1';

	const output = await gum(['choose', limit, ...options]);
	return output.split('\n');
}

export async function input(options?: {
	placeholder?: string;
	prompt?: string;
	defaultValue?: string;
}) {
	const args = [];
	options?.placeholder && args.push(`--placeholder=${options.placeholder}`);
	options?.prompt && args.push(`--prompt=${options.prompt}`);
	options?.defaultValue && args.push(`--value=${options.defaultValue}`);

	return await gum(['input', '--width=80', ...args]);
}

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

export async function confirm(options?: {
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

	const p = await Deno.run({
		cmd: ['gum', 'confirm', ...args],
	});

	const { success } = await p.status();
	return success;
}

/** @see https://github.com/charmbracelet/gum/blob/main/style/options.go */
export async function style(lines: string[], options?: GumStyleOptions) {
	const args: string[] = [];
	for (let [key, value] of Object.entries(options ?? {})) {
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

	const p = await Deno.run({
		cmd: ['gum', 'style', ...args, ...lines],
	});

	const { success, code } = await p.status();
	if (!success) {
		throw new CommandExecutionException(code);
	}
}

async function gum(cmd: string[]): Promise<string> {
	const p = await Deno.run({
		cmd: ['gum', ...cmd],
		stdout: 'piped',
	});

	const { success, code } = await p.status();
	if (!success) {
		throw new CommandExecutionException(code);
	}
	const output = await p.output();
	const decoded = new TextDecoder().decode(output);
	return decoded.trim();
}
