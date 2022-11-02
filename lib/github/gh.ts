import { runCommand } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
}

async function createPullRequest(options: {
	baseBranch: string;
}) {
	await runCommand(
		'gh',
		'pr',
		'create',
		'--fill',
		'--assignee',
		'@me',
		'--base',
		options.baseBranch,
	);
}
