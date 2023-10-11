import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';

interface ChooseSettings {
	header?: string;
}

export async function _gum_chooseOne<Option extends string>(
	options: readonly Option[],
	settings: ChooseSettings & {
		selectedOption?: Option;
	} = {},
): Promise<Option> {
	const selectedOption = await choose(options, {
		...settings,
		multiselect: false,
		selectedOptions: settings.selectedOption ? [settings.selectedOption] : undefined,
	});
	assertValidOption(selectedOption, options);

	return selectedOption;
}

export async function _gum_chooseMultiple<Option extends string>(
	options: readonly Option[],
	settings: ChooseSettings & {
		selectedOptions?: Option[];
	} = {},
): Promise<Option[]> {
	const selectedOptionsString = await choose(options, {
		multiselect: true,
		...settings,
	});
	const selectedOptions = selectedOptionsString.split('\n');

	if (selectedOptions.length === 1 && selectedOptions[0] === '') {
		return [];
	}

	assertValidOptions(selectedOptions, options);

	return selectedOptions;
}

async function choose<Option extends string>(
	options: readonly Option[],
	settings:
		& ChooseSettings
		& ({
			multiselect: true;
			selectedOptions?: readonly Option[];
		} | {
			multiselect: false;
			selectedOptions?: [Option];
		}),
): Promise<string> {
	return await runAndCapture(
		'gum',
		'choose',
		`--header=${settings.header ?? ''}`,
		settings.multiselect ? '--no-limit' : '--limit=1',
		...(settings.selectedOptions ?? []).map((option) => `--selected=${option}`),
		`--header.foreground=${ColorScheme.primary}`,
		`--selected.foreground=${ColorScheme.primary}`,
		`--cursor.foreground=${ColorScheme.primary}`,
		`--selected.bold=true`,
		'--cursor-prefix=⬡ ',
		'--unselected-prefix=⬡ ',
		'--selected-prefix=⬢ ',
		...options,
	);
}

function assertValidOption<Option extends string>(
	selectedOption: string,
	validOptions: readonly Option[],
): asserts selectedOption is Option {
	if (!validOptions.includes(selectedOption as Option)) {
		throw new Error(
			`Gum returned option ${selectedOption} that was not in possible option ${validOptions}`,
		);
	}
}

function assertValidOptions<Option extends string>(
	selectedOptions: string[],
	validOptions: readonly Option[],
): asserts selectedOptions is Option[] {
	selectedOptions.forEach((option) => assertValidOption(option, validOptions));
}
