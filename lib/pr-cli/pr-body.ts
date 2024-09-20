import { colors } from '@cliffy/ansi/colors';
import { ColorScheme, colorTo24Bit } from '../colors.ts';
import { Gum } from '../gum/gum.ts';
import type { Commit, CommitWithBody } from '../git/commit.ts';
import { Git } from '../git/git.ts';

export const startMarker = '<!-- pr-cli body start -->';
export const replacementExplanation =
	'<!-- Anything between the start and end tags will be replaced when updating a PR -->';
export const endMarker = '<!-- pr-cli body end -->';

export async function generatePullRequestBody(commits: Commit[]): Promise<string> {
	const commitsWithBody = await Promise.all(commits.map(Git.getCommitBody));
	return formatPullRequestBody(commitsWithBody);
}

export function replacePRCLIPartOfBody(currentBody: string, newBody: string): string {
	const parts: string[] = [];
	const startMarkerIndex = currentBody.indexOf(startMarker);
	if (startMarkerIndex > 0) {
		parts.push(currentBody.slice(0, startMarkerIndex));
	}

	parts.push(newBody);

	const endMarkerIndex = currentBody.indexOf(endMarker, startMarkerIndex);
	if (endMarkerIndex > 0) {
		parts.push(currentBody.slice(endMarkerIndex + endMarker.length));
	}

	return parts.join('');
}

export function formatPullRequestBody(commitsWithBody: CommitWithBody[]): string {
	return wrapInMarkers(formatCommits(commitsWithBody));
}

function formatCommits(commitsWithBody: CommitWithBody[]): string {
	return commitsWithBody
		.map((commit) => {
			const message = `#### ${commit.message}`;
			const body = commit.body.trim().length < 1 ? '' : `\n\n${commit.body}`;
			return message + body;
		})
		.join('\n\n<br>\n\n');
}

function wrapInMarkers(body: string): string {
	return [
		startMarker,
		replacementExplanation,
		body,
		endMarker,
	].join('\n');
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
