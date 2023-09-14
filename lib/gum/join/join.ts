import { runAndCaptureRaw, runCommand } from '../../shell/shell.ts';

interface GumJoinOptions {
	align?: 'left' | 'center' | 'right' | 'bottom' | 'middle' | 'top',
	joinAxis?: 'horizontal' | 'vertical'
}

function convertOptions(options: GumJoinOptions) {
	const args: string[] = [];
	if (options.align) {
		args.push(`--align=${options.align}`);
	}

	if (options.joinAxis) {
		args.push(`--${options.joinAxis}`);
	}

	return args;
}

/** @see https://github.com/charmbracelet/gum/blob/main/join/options.go */
export async function _gum_join(parts: string[], options?: GumJoinOptions) {
	const args = convertOptions(options ?? {});

	await runCommand('gum', 'join', ...args, ...parts);
}

/** @see https://github.com/charmbracelet/gum/blob/main/join/options.go */
export async function _gum_join_to_string(parts: string[], options?: GumJoinOptions) {
	const args = convertOptions(options ?? {});

	return await runAndCaptureRaw('gum', 'join', ...args, ...parts);
}
