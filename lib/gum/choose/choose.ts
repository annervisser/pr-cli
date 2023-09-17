import { runAndCapture } from '../../shell/shell.ts';
import { ColorScheme } from '../../colors.ts';

export async function _gum_chooseOne<Option extends string>(options: readonly Option[], settings: {
	selectedOption?: Option;
} = {}): Promise<Option> {
	const selectedOption = await choose(options, {
		multiselect: false,
		selectedOptions: settings.selectedOption ? [settings.selectedOption] : undefined,
	});
	assertValidOption(selectedOption, options);

	return selectedOption;
}

export async function _gum_chooseMultiple<Option extends string>(
	options: readonly Option[],
	settings: {
		selectedOptions?: Option[];
	} = {},
): Promise<Option[]> {
	const selectedOptionsString = await choose(options, {
		multiselect: true,
		selectedOptions: settings.selectedOptions,
	});
	const selectedOptions = selectedOptionsString.split('\n');
	assertValidOptions(selectedOptions, options);

	return selectedOptions;
}

async function choose<Option extends string>(
	options: readonly Option[],
	settings: {
		multiselect: true;
		selectedOptions?: readonly Option[];
	} | {
		multiselect: false;
		selectedOptions?: [Option];
	},
): Promise<string> {
	return await runAndCapture(
		'gum',
		'choose',
		settings.multiselect ? '--no-limit' : '--limit=1',
		...(settings.selectedOptions ?? []).map((option) => `--selected=${option}`),
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
