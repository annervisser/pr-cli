import { log } from '../../deps.ts';
import { runAndCapture, runCommand } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
	public static doesBranchHavePullRequest = doesBranchHavePullRequest;
}

interface BasePROptions {
	baseBranch?: string;
	draftPR?: boolean;
	web?: boolean;
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
	options.web && args.push('--web');

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
		// gh pr view doesn't work for multi-remote use cases, gh pr list does
		// This will give a false positive for prs from a different repository with the same branch name
		const json = await runAndCapture('gh', 'pr', 'list', '--head', branch, '--json', 'title');
		const pr = JSON.parse(json);
		if (!Array.isArray(pr)) {
			log.error('Invalid response from gh cli:', pr);
			return false;
		}
		return pr.length > 0;
	} catch {
		return false;
	}
}
