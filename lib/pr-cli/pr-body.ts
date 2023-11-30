import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { ColorScheme, colorTo24Bit } from '../colors.ts';
import { Gum } from '../gum/gum.ts';
import { Commit, CommitWithBody } from '../git/commit.ts';
import { Git } from '../git/git.ts';

export async function generatePullRequestBody(commits: Commit[]): Promise<string> {
	const commitsWithBody = await Promise.all(commits.map(Git.getCommitBody));
	return formatCommits(commitsWithBody);
}

export function formatCommits(commitsWithBody: CommitWithBody[]): string {
	return commitsWithBody
		.map((commit) => {
			const message = `#### ▹ ${commit.message}`;
			const body = commit.body.trim().length < 1 ? '' : `\n\n${commit.body}`;
			return message + body;
		})
		.join('\n\n---\n\n');
}

export async function writePullRequestBody(currentBody: string, height: number) {
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
