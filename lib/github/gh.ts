import { runCommand, runVoid } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
	public static doesBranchHavePullRequest = doesBranchHavePullRequest;
}

interface BasePROptions {
	baseBranch?: string;
	draftPR?: boolean;
}

interface ManualTitleAndBody {
	title: string;
	body: string;
}

interface AutomaticTitleAndBody {
	autofill: true;
}

type PullRequestOptions = BasePROptions & (ManualTitleAndBody | AutomaticTitleAndBody);

async function createPullRequest(options: PullRequestOptions) {
	const args: string[] = [];
	options.baseBranch && args.push('--base', options.baseBranch);
	options.draftPR && args.push('--draft');

	if ('autofill' in options) {
		args.push('--fill');
	} else {
		args.push('--title', options.title);
		args.push('--body', options.body);
	}

	await runCommand(
		'gh',
		'pr',
		'create',
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
