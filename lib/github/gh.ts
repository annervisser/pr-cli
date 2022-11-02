import { runCommand } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
}

async function createPullRequest(options: {
	baseBranch?: string;
}) {
	const args: string[] = [];
	options.baseBranch && args.push('--base', options.baseBranch);

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
