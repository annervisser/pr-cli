import { runAndCapture } from '../../shell/shell.ts';

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
	const limit = multiselect ? '--no-limit' : '--limit=1';

	const output = await runAndCapture('gum', ...['choose', limit, ...options]);
	return output.split('\n');
}
