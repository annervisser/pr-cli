import { GitPickSettings } from './git-pick.ts';
import { colors } from 'cliffy/ansi';
import { Gum } from 'lib/gum/gum.ts';
import { ColorScheme } from 'lib/colors.ts';

interface ConfirmationContext {
	branchExists: boolean;
}

export async function confirmSettings(
	options: GitPickSettings,
	context: ConfirmationContext,
): Promise<boolean> {
	const i = '‣' + colors.reset(' '); //colors.green('‣');
	const commitLines = options.commits.map((commit) =>
		`  └▷ ${colors.dim.cyan(commit.sha)} ${colors.cyan(commit.message)}`
	);

	const check = (check: boolean) => check ? colors.green('✔') : colors.red.bold('✗');

	let branchExistsWarning = '';
	if (context.branchExists) {
		branchExistsWarning = options.overwriteLocalBranch
			? ` ${colors.brightRed('! Overwriting')}`
			: ` ${colors.bold.red('! branch exists')}`;
	}
	const forceString = options.forcePush ? `${colors.red('force')} ` : '';

	const lines = [
		`${i}About to cherry pick commits:`,
		...commitLines,
		`${i}Base branch: ${colors.dim.yellow(options.pullRemote)}/${
			colors.yellow(options.upstreamBranch)
		}`,
		`${i}Branch name: ${colors.dim.yellow(options.pushRemote)}/${
			colors.yellow(options.branchName)
		}${branchExistsWarning}`,
		`${i}${check(options.push)} ${forceString}push  |  ${check(options.pr)} pull request`,
	];

	await Gum.style(lines, {
		foreground: ColorScheme.primary,
		border: 'rounded',
		margin: [1, 1],
		padding: [0, 2],
		'border-foreground': ColorScheme.primary,
	});

	return await Gum.confirm({
		prompt: 'Continue?',
		startOnAffirmative: true,
	});
}
