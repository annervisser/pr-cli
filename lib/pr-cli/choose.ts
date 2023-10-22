import { ChooseSettings } from '../gum/choose/choose.ts';
import { Gum } from '../gum/gum.ts';
import { colors } from '../../deps.ts';

type Formatter<Option> = (option: Option) => string;
const noopFormatter: Formatter<string> = (s) => s;

type GenericChooseSettings = Omit<ChooseSettings, 'selectedOptions' | 'multiselect'>;
type ChooseOneSettings<Option> = GenericChooseSettings & { selectedOption?: Option };
type ChooseMultipleSettings<Option> = GenericChooseSettings & {
	selectedOptions?: readonly Option[];
};

export async function chooseOne<Option extends string>(
	options: readonly Option[],
	chooseSettings?: ChooseOneSettings<Option>,
): Promise<Option> {
	return await chooseOneFormatted(options, noopFormatter, chooseSettings);
}

export async function chooseOneFormatted<Option>(
	options: readonly Option[],
	format: Formatter<Option>,
	{ selectedOption, ...chooseSettings }: ChooseOneSettings<Option> = {},
): Promise<Option> {
	const selected = await _choose(options, format, {
		...chooseSettings,
		selectedOptions: selectedOption ? [selectedOption] : undefined,
		multiselect: false,
	});
	if (selected.length !== 1) {
		throw new Error(
			`Multiple options returned when only 1 was expected: ${JSON.stringify(selected)}`,
		);
	}
	return selected[0]!;
}

export async function chooseMultiple<Option extends string>(
	options: readonly Option[],
	chooseSettings?: ChooseMultipleSettings<Option>,
): Promise<Option[]> {
	return await chooseMultipleFormatted(options, noopFormatter, chooseSettings);
}

export async function chooseMultipleFormatted<Option>(
	options: readonly Option[],
	format: Formatter<Option>,
	chooseSettings?: ChooseMultipleSettings<Option>,
): Promise<Option[]> {
	return await _choose(options, format, { ...chooseSettings, multiselect: true });
}

async function _choose<Option>(
	options: readonly Option[],
	format: Formatter<Option>,
	chooseSettings?: ChooseMultipleSettings<Option> & { multiselect: boolean },
): Promise<Option[]> {
	const { optionsMap, optionStrings } = createOptionMap(options, format);

	const selection = await Gum.choose(
		optionStrings,
		{ ...chooseSettings, selectedOptions: chooseSettings?.selectedOptions?.map(format) },
	);

	return selection.map((selected) => getOptionFromMap(selected, optionsMap));
}

function createOptionMap<Option>(
	options: readonly Option[],
	format: Formatter<Option>,
): { optionsMap: Map<string, Option>; optionStrings: readonly string[] } {
	const optionsMap = new Map<string, Option>();
	const optionStrings: string[] = [];

	for (const option of options) {
		const optionString = format(option);
		optionStrings.push(optionString);

		const key = normalizeOptionString(optionString);
		if (optionsMap.has(key)) {
			throw new Error('Options must be unique');
		}
		optionsMap.set(key, option);
	}
	return { optionsMap, optionStrings };
}

function getOptionFromMap<Option>(selected: string, options: Map<string, Option>): Option {
	selected = normalizeOptionString(selected);
	if (!options.has(selected)) {
		throw new Error(
			`Expected selected option to be one of ${JSON.stringify(options.keys())}, got ${selected}`,
		);
	}
	return options.get(selected)!;
}

function normalizeOptionString(optionString: string): string {
	return colors.stripColor(optionString);
}
