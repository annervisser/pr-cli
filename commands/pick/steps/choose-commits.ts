import { Gum } from '../../../lib/gum/gum.ts';
import { Commit } from '../../../lib/git/commit.ts';

const separator = `\t`;

export async function chooseCommits(commits: Commit[]) {
	const commitStrings = commits.map((commit) => `${commit.sha}${separator}${commit.message}`);

	const pickedCommitLines = await Gum.chooseMultiple(commitStrings);

	const pickedCommitSHAs = new Set(
		pickedCommitLines.map((line) => line.split(separator, 1)![0]),
	);

	return commits.filter((commit) => pickedCommitSHAs.has(commit.sha));
}
