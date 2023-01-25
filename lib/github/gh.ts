import { runCommand } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
}

async function createPullRequest(options: {
	baseBranch?: string;
	draftPR?: boolean;
}) {
	const args: string[] = [];
	options.baseBranch && args.push('--base', options.baseBranch);
	options.draftPR && args.push('--draft');

	await runCommand(
		'gh',
		'pr',
		'create',
		'--fill',
		'--assignee',
		'@me',
		...args,
	);
}
