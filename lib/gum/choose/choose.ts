import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';

export async function _gum_chooseOne(options: string[]): Promise<string[]> {
	return await choose(options, false);
}

export async function _gum_chooseMultiple(options: string[]): Promise<string[]> {
	return await choose(options, true);
}

async function choose(
	options: string[],
	multiselect: boolean,
): Promise<string[]> {
	const output = await runAndCapture(
		'gum',
		'choose',
		multiselect ? '--no-limit' : '--limit=1',
		`--selected.foreground=${ColorScheme.primary}`,
		`--cursor.foreground=${ColorScheme.primary}`,
		`--selected.bold=true`,
		'--cursor-prefix=⬡ ',
		'--unselected-prefix=⬡ ',
		'--selected-prefix=⬢ ',
		...options,
	);
	return output.split('\n');
}
