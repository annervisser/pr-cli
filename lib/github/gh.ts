import { runCommand, runVoid } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
	public static doesBranchHavePullRequest = doesBranchHavePullRequest;
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

async function doesBranchHavePullRequest(branch: string): Promise<boolean> {
	try {
		await runVoid('gh', 'pr', 'view', '--json', 'title', branch);
		return true;
	} catch {
		return false;
	}
}
