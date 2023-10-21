import { slugify, unslugify } from '../slug/slug.ts';
import { Git } from '../git/git.ts';
import { Commit } from '../git/commit.ts';

const mdDetailsBlock = (summary: string, details: string) =>
	`<details>
<summary>${summary}</summary>

${details}
</details>`;

export function generatePullRequestTitle(branchName: string): string {
	let title = unslugify(branchName);
	title = title.charAt(0).toUpperCase() + title.slice(1);

	return title;
}

export async function generatePullRequestBody(commits: Commit[]): Promise<string> {
	const commitsWithBody = await Promise.all(commits.map(Git.getCommitBody));

	if (commitsWithBody.length === 1) {
		const commit = commitsWithBody[0]!;
		return `${commit.message}\n\n${commit.body}`;
	}

	return commitsWithBody
		.map((commit) =>
			commit.body.trim().length < 1
				? `▹ ${commit.message}`
				: mdDetailsBlock(commit.message, commit.body)
		)
		.join('\n\n---\n');
}

export function convertToValidBranchName(message: string): string {
	return slugify(message);
}

export async function assertValidBranchName(branchName: string) {
	if (!await Git.isValidBranchName(branchName)) {
		throw new Error(`Branch name "${branchName}" is invalid`);
	}
}

export function assertValidTitle(title: string) {
	if (!title) {
		throw new Error(`Title "${title}" is invalid`);
	}
}
