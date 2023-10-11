import { GitPickSettings } from './git-pick.ts';
import { Gum } from '../../../lib/gum/gum.ts';
import { ColorScheme, colorTo24Bit } from '../../../lib/colors.ts';
import { colors, tty } from '../../../deps.ts';
import { getKeySequence } from '../../../lib/keypress.ts';
import { CommandExecutionException } from '../../../lib/shell/shell.ts';
import { Git } from '../../../lib/git/git.ts';
import { GumStyleOptions } from '../../../lib/gum/style/style.ts';

interface ConfirmationContext {
	branchExists: boolean;
}

export async function confirmSettings(
	settings: GitPickSettings,
	context: ConfirmationContext,
): Promise<GitPickSettings> {
	let result: SettingModificationAction | KeySequenceResult = () => settings;
	let lastSummaryLineCount = await printSummary(settings, context);

	while (true) {
		try {
			result = await listenForKeySequence(settings, lastSummaryLineCount);
		} catch (e) {
			// If an error occurs (i.e. ctrl+c is pressed), make sure the output is on a new line
			tty.text('\n');
			throw e;
		}

		if (result === KeySequenceResult.Confirmed) {
			// Clear 'Press enter to continue' and keys info
			tty.eraseLines(4);
			return settings;
		}

		if (result === KeySequenceResult.Unhandled) {
			continue;
		}

		tty.eraseLines(lastSummaryLineCount);
		const cursorBefore = tty.getCursorPosition().y;
		try {
			settings = await result(settings);
		} catch (err) {
			if (!(err instanceof CommandExecutionException && err.code === 130)) {
				// Treat ctrl+c or esc as aborting the edit, not the whole command
				throw err;
			}
		}
		const cursorNow = tty.getCursorPosition().y;
		if (cursorNow > cursorBefore) {
			// If there has been output while handling the key, make sure our summary writes over it
			tty.cursorUp(cursorNow - cursorBefore);
		}

		lastSummaryLineCount = await printSummary(settings, context);
	}
}

async function printSummary(
	settings: Readonly<GitPickSettings>,
	context: ConfirmationContext,
) {
	const summary = await getSummaryForSettings(settings, context);
	const lineCount = summary.split('\n').length;
	tty.text(summary);

	return lineCount;
}

async function getSummaryForSettings(
	settings: Readonly<GitPickSettings>,
	context: ConfirmationContext,
) {
	const i = '‣' + colors.reset(' '); //colors.green('‣');
	const commitLines = settings.commits.map((commit) =>
		`  └▷ ${colors.dim.cyan(commit.sha)} ${colors.cyan(commit.message)}`
	);

	const check = (check: boolean) => check ? colors.green('✔') : colors.red.bold('✗');
	const key = (key: string) => colors.inverse.bold(`${key}`);

	let branchExistsWarning = '';
	if (context.branchExists) {
		branchExistsWarning = settings.overwriteLocalBranch
			? ` ${colors.brightRed('! Overwriting')}`
			: ` ${colors.bold.red('! branch exists')}`;
	}

	const pullRemote = colors.dim.yellow(settings.pullRemote);
	const upstreamBranch = colors.yellow(settings.upstreamBranch);
	const pushRemote = colors.dim.yellow(settings.pushRemote);
	const branchName = colors.yellow(settings.branchName);

	const pushBranch = `${pushRemote}/${branchName}`;

	const forceString = settings.forcePush ? `${colors.red('force')} ` : '';
	const pushOptions = `${check(settings.push)} ${forceString}push`;

	const isDraftPR = settings.createPR && settings.draftPR;
	const draftString = isDraftPR ? `${colors.brightBlack('draft')} ` : '';
	const prOptions = `${check(settings.createPR)} ${draftString}pull request: ${settings.title}`;

	const summaryLines = [
		`${i}About to cherry pick commits:`,
		...commitLines,
		`${i}Base branch: ${pullRemote}/${upstreamBranch}`,
		`${i}Branch name: ${settings.push ? pushBranch : branchName}${branchExistsWarning}`,
		`${i}${pushOptions}`,
		`${i}${prOptions}`,
	];
	const keys = [
		`p${key('u')}sh`,
		`${key('b')}ranch`,
	];
	if (settings.push) {
		keys.unshift(
			`${key('f')}orce`,
			`${key('p')}r`,
		);
	}
	if (settings.createPR) {
		keys.push(
			`${key('d')}raft`,
			`${key('t')}itle`,
			`${key('e')}dit body`,
		);
	}

	const keyLegendLine = colors.gray(keys.join(' | '));
	const continueLine = 'Press Enter to continue';

	const maxLineLength = getMaxLineLength([...summaryLines, keyLegendLine, continueLine]);

	const blockWidth = Math.min(
		maxLineLength + 4, // longest line + padding
		Deno.consoleSize().columns - 4, // terminal width - padding
	);
	const blockSettings = {
		border: 'rounded',
		width: blockWidth,
		margin: [0, 1],
		padding: [0, 2],
	} satisfies GumStyleOptions;

	const blocks = [
		await Gum.styleToString(summaryLines, {
			...blockSettings,
			foreground: ColorScheme.primary,
			'border-foreground': ColorScheme.primary,
		}),
		await Gum.styleToString([keyLegendLine], blockSettings),
	];
	const summary = await Gum.joinToString(
		blocks,
		{
			align: 'left',
			joinAxis: 'vertical',
		},
	);
	const blockSize = getMaxLineLength(summary.split('\n', 1));
	const continueBlock = await Gum.styleToString([continueLine], {
		align: 'left',
		foreground: ColorScheme.primary,
		bold: true,
		padding: [0, 0, 0, Math.round(blockSize / 2 - continueLine.length / 2)],
	});
	// Replace newline after continue block with a space, so the cursor appears right after it
	return summary + continueBlock.slice(0, -1) + ' ';
}

function getMaxLineLength(lines: string[]): number {
	return lines.map((line) => colors.stripColor(line).length)
		.sort((a, b) => a - b)
		.at(-1)!;
}

enum KeySequenceResult {
	Confirmed,
	Unhandled,
}

type SettingModificationAction = (
	settings: GitPickSettings,
) => Promise<GitPickSettings> | GitPickSettings;

async function listenForKeySequence(
	settings: GitPickSettings,
	maxHeight: number,
): Promise<SettingModificationAction | KeySequenceResult> {
	let actionMap: Record<string, SettingModificationAction | KeySequenceResult> = {
		// pUsh settings
		'u': async (settings: GitPickSettings) => {
			const dontPush = 'Don\'t push';
			const remotes = await Git.listRemotes();
			await Gum.style(['Where should your branch be pushed to?'], {
				background: ColorScheme.primary,
				foreground: 0,
				padding: [0, 1],
			});
			const pushRemote = await Gum.chooseOne([dontPush, ...remotes], {
				selectedOption: settings.push ? settings.pushRemote : dontPush,
			});
			if (pushRemote === dontPush) {
				return ({ ...settings, push: false, createPR: false });
			} else {
				return ({ ...settings, push: true, pushRemote: pushRemote });
			}
		},
		// Branch
		'b': async (settings: GitPickSettings) => ({
			...settings,
			branchName: await Gum.input({ defaultValue: settings.branchName, prompt: 'Branch name: ' }),
		}),
		'return': KeySequenceResult.Confirmed,
	};

	if (settings.push) {
		actionMap = {
			...actionMap,
			// Pr
			'p': (settings: GitPickSettings) => ({ ...settings, createPR: !settings.createPR }),
			// Force
			'f': (settings: GitPickSettings) => ({ ...settings, forcePush: !settings.forcePush }),
		};
	}

	if (settings.createPR) {
		actionMap = {
			...actionMap,
			// Draft
			'd': (settings: GitPickSettings) => ({ ...settings, draftPR: !settings.draftPR }),
			// Title
			't': async (settings: GitPickSettings) => ({
				...settings,
				title: await Gum.input({ defaultValue: settings.title, prompt: 'Pull request title: ' }),
			}),
			// Edit body
			'e': async (settings: GitPickSettings) => ({
				...settings,
				body: await promptForPullRequestBody(settings.body, maxHeight),
			}),
		};
	}

	const keyPress = await getKeySequence();
	return actionMap[keyPress] ?? KeySequenceResult.Unhandled;
}

async function promptForPullRequestBody(currentBody: string, height: number) {
	const inputWidth = 100;
	const recommendedWidth = 72;
	const lineNumberOverhead = 4; // space + line number (` 1`-`99`) + space

	const overHeadText = ' 📄 '; // ! length needs to match lineNumberOverhead (📄 emoji = 2)
	const headerText = ' Pull request body';
	const saveText = ' (Ctrl+d to save)';
	const overflowText = ` ! >${recommendedWidth}`;

	// Do this before adding any ANSI color characters
	const headerPadding = ' '.repeat(recommendedWidth - headerText.length - saveText.length);

	const bg = (color: string) => (text: string) => colors.bgRgb24(text, colorTo24Bit(color));

	return await Gum.write({
		width: inputWidth + lineNumberOverhead,
		height: height - 1, // subtract the header line
		header: bg(ColorScheme.primarySaturated)(colors.brightWhite(overHeadText)) +
			bg(ColorScheme.primary)(
				colors.bold.black(headerText) + colors.brightBlack(saveText) + headerPadding,
			) +
			bg(ColorScheme.primaryDarker)(overflowText.padEnd(inputWidth - recommendedWidth)),
		showLineNumbers: true,
		showCursorLine: true,
		value: currentBody,
	});
}
