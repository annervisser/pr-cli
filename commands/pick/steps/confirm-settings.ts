import { GitPickSettings } from './git-pick.ts';
import { colors } from 'cliffy/ansi';
import { Gum } from 'lib/gum/gum.ts';
import { ColorScheme } from 'lib/colors.ts';

export async function confirmSettings(options: GitPickSettings): Promise<boolean> {
	const infoSign = colors.brightGreen('ℹ');
	const commitLines = options.commits.map((commit) =>
		`  └▷ ${colors.magenta(commit.sha)} ${colors.cyan(commit.message)}`
	);

	const lines = [
		`${infoSign} About to cherry pick commits:`,
		...commitLines,
		`${infoSign} Base branch: ${colors.cyan(options.pullRemote)}/${
			colors.cyan(options.upstreamBranch)
		}`,
		`${infoSign} Branch name: ${colors.cyan(options.branchName)}`,
	];

	await Gum.style(lines, {
		foreground: ColorScheme.primary,
		border: 'double',
		margin: [1, 1],
		padding: [0, 2],
		'border-foreground': ColorScheme.primary,
	});

	return await Gum.confirm({
		prompt: 'Continue?',
		startOnAffirmative: true,
	});
}
