import { GitPickSettings } from '../git-pick.ts';
import { colors } from 'cliffy/ansi';
import { confirm, style } from 'lib/gum/gum.ts';

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

	await style(lines, {
		foreground: '#ff88ff',
		border: 'double',
		margin: [1, 1],
		padding: [0, 2],
		'border-foreground': '#ff88ff',
	});

	return await confirm({
		prompt: 'Continue?',
		startOnAffirmative: true,
	});
}
