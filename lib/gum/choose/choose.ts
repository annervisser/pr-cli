import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';

export interface ChooseSettings {
	header?: string;
	multiselect?: boolean;
	selectedOptions?: readonly string[];
}

export async function _gum_choose(
	options: readonly string[],
	settings?: ChooseSettings,
): Promise<string[]> {
	const selectedOptionsString = await runAndCapture(
		'gum',
		'choose',
		`--header=${settings?.header ?? ''}`,
		settings?.multiselect ? '--no-limit' : '--limit=1',
		`--selected=${(settings?.selectedOptions?.map(escapeSelectedOption).join(',') ?? '')}`,
		`--header.foreground=${ColorScheme.primary}`,
		`--selected.foreground=${ColorScheme.primary}`,
		`--cursor.foreground=${ColorScheme.primary}`,
		`--selected.bold=true`,
		'--cursor-prefix=⬡ ',
		'--unselected-prefix=⬡ ',
		'--selected-prefix=⬢ ',
		...options,
	);

	const selectedOptions = selectedOptionsString.split('\n');
	if (selectedOptions.length === 1 && selectedOptions[0] === '') {
		return [];
	}

	return selectedOptions;
}

/** Because selected options are seperated by commas, escape commas within options with a backslash */
const escapeSelectedOption = (option: string): string => option.replaceAll(',', '\\,');
