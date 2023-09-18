import { runAndCapture, runCommand } from '../shell/shell.ts';

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
		const json = await runAndCapture('gh', 'pr', 'view', '--json', 'closed,title', branch);
		const pr = JSON.parse(json);
		return pr.closed !== true;
	} catch {
		return false;
	}
}
