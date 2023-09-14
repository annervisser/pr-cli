import { GitPickSettings } from './git-pick.ts';
import { Gum } from '../../../lib/gum/gum.ts';
import { ColorScheme } from '../../../lib/colors.ts';
import { colors, tty } from '../../../deps.ts';
import { CommandExecutionException } from '../../../lib/shell/shell.ts';

interface ConfirmationContext {
	branchExists: boolean;
}

async function getSummaryForOptions(options: Readonly<GitPickSettings>, context: ConfirmationContext) {
	const i = '‣' + colors.reset(' '); //colors.green('‣');
	const commitLines = options.commits.map((commit) =>
		`  └▷ ${colors.dim.cyan(commit.sha)} ${colors.cyan(commit.message)}`
	);

	const check = (check: boolean) => check ? colors.green('✔') : colors.red.bold('✗');
	const key = (key: string) => colors.inverse.bold(`${key}`);

	let branchExistsWarning = '';
	if (context.branchExists) {
		branchExistsWarning = options.overwriteLocalBranch
			? ` ${colors.brightRed('! Overwriting')}`
			: ` ${colors.bold.red('! branch exists')}`;
	}

	const pullRemote = colors.dim.yellow(options.pullRemote);
	const upstreamBranch = colors.yellow(options.upstreamBranch);
	const pushRemote = colors.dim.yellow(options.pushRemote);
	const branchName = colors.yellow(options.branchName);

	const forceString = options.forcePush ? `${colors.red('force')} ` : '';
	const pushOptions = `${check(options.push)} ${forceString}push`;

	const draftString = options.pr && options.draftPR ? `${colors.underline.white('draft')} ` : '';
	const prOptions = `${check(options.pr)} ${draftString}pull request`;

	const lines = [
		`${i}About to cherry pick commits:`,
		...commitLines,
		`${i}Base branch: ${pullRemote}/${upstreamBranch}`,
		`${i}Branch name: ${pushRemote}/${branchName}${branchExistsWarning}`,
		`${i}${pushOptions}  |  ${prOptions}`,
	];
	const keyLegendLine = colors.gray(`${key('f')}orce | ${key('p')}r | ${key('d')}raft`);

	const summaryBlock = await Gum.styleToString(lines, {
		foreground: ColorScheme.primary,
		border: 'rounded',
		margin: [0, 1],
		padding: [0, 2],
		'border-foreground': ColorScheme.primary,
	});
	const keyLegend = await Gum.styleToString([keyLegendLine], {
		align: 'center',
		margin: 0,
		padding: 0,
	});
	return await Gum.joinToString([
		summaryBlock.slice(0, -1), // Trim the final newline of the block
		keyLegend
	], {
		align: 'center',
		joinAxis: 'vertical',
	});
}

export async function confirmSettings(
	options: Readonly<GitPickSettings>,
	context: ConfirmationContext,
): Promise<boolean> {
	ikwilunietlangerietsvragen:
		while (true) {
			const summary = await getSummaryForOptions(options, context);

			const lineCount = summary.split('\n').length;
			tty.text(summary);

			const command = await getInput();
			tty.eraseLines(lineCount);

			switch (command) {
				case 'd':
					if (options.pr) {
						options = {...options, draftPR: !options.draftPR};
					}
					break;
				case 'p':
					options = {...options, pr: !options.pr};
					break;
				case 'f':
					options = {...options, forcePush: !options.forcePush};
					break;
				case 'b':
					console.log('change branch name');
					break;
				case '\r':
				case 'y':
					console.log('continue');
					break ikwilunietlangerietsvragen;
			}
		}

	console.log('bye');
	return false;
}

async function getInput(): Promise<string> {
	try {
		Deno.stdin.setRaw(true);
		// buffer size of 1 is enough for basic character support, not for emoji and other multibyte graphemes
		const buf = new Uint8Array(1);
		const n = await Deno.stdin.read(buf);
		if (!n) {
			throw new Error('@TODO figure out what to do');
		}
		if (buf[0] === 0x03) {
			// Ctrl+c
			throw new CommandExecutionException(130);
		}
		return new TextDecoder().decode(buf.subarray(0, n));
	} finally {
		// Always disable raw mode, otherwise the terminal will be mangled
		Deno.stdin.setRaw(false);
	}
}
