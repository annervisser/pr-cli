import { log } from '../../deps.ts';
import { runAndCapture, runCommand } from '../shell/shell.ts';

export class GH {
	public static createPullRequest = createPullRequest;
	public static editPullRequest = editPullRequest;
	public static doesBranchHavePullRequest = doesBranchHavePullRequest;
}

interface BasePROptions {
	baseBranch?: string;
	draftPR?: boolean;
}

interface CreatePROptions {
	web?: boolean;
}

interface ManualTitleAndBody {
	autofill?: false;
	title: string;
	body: string;
}

interface AutomaticTitleAndBody {
	autofill: true;
	title?: undefined;
	body?: undefined;
}

type PullRequestOptions =
	& BasePROptions
	& CreatePROptions
	& (ManualTitleAndBody | AutomaticTitleAndBody);
type EditPullRequestOptions = BasePROptions & ManualTitleAndBody;

async function createPullRequest(options: PullRequestOptions) {
	const args: string[] = [];
	options.baseBranch && args.push('--base', options.baseBranch);
	options.draftPR && args.push('--draft');
	options.web && args.push('--web');

	if (options.autofill) {
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

async function editPullRequest(options: EditPullRequestOptions) {
	const args: string[] = [];
	options.baseBranch && args.push('--base', options.baseBranch);
	options.draftPR && args.push('--draft');

	await runCommand(
		'gh',
		'pr',
		'edit',
		'--add-assignee',
		'@me',
		'--title',
		options.title,
		'--body',
		options.body,
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
