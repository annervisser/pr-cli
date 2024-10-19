import * as log from '@std/log';
import { runAndCapture, runCommand } from '../shell/shell.ts';

export const GH = {
	createPullRequest,
	editPullRequest,
	setPullRequestDraftStatus,
	listPullRequests,
	getPullRequestInfoForCurrentBranch,
	getPullRequestInfoForBranch,
};

interface BasePROptions {
	baseBranch?: string;
}

interface CreatePROptions {
	web?: boolean;
	draftPR?: boolean;
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

export interface PullRequest {
	title: string;
	body: string;
	number: number;
	isDraft: boolean;
	baseRefName: string;
	headRefName: string;
	commits: Array<{
		messageHeadLine: string;
		messageBody: string;
		oid: string; // 464fc5a0d27f6053647cdb5939a936b91aaa91fc
	}>;
}

async function getPullRequestInfoForCurrentBranch() {
	const json = await runAndCapture(
		'gh',
		'pr',
		'view',
		'--json',
		'headRefOid,number,body',
	);
	const pr = JSON.parse(json);
	return {
		headRefOid: pr.headRefOid as string,
		number: pr.number as number,
		body: pr.body as string,
	};
}

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

async function setPullRequestDraftStatus(draft: boolean) {
	const args = draft ? ['--undo'] : [];
	await runCommand('gh', 'pr', 'ready', ...args);
}

async function getPullRequestInfoForBranch(branch: string) {
	// gh pr view doesn't work for multi-remote use cases, gh pr list does
	// This will give a false positive for prs from a different repository with the same branch name
	const prs = await listPullRequests({ head: branch });
	if (prs.length < 1) {
		return null;
	}

	if (prs.length > 1) {
		log.warn('More than 1 matching PR found:', prs.map((pr) => pr.number));
	}

	return prs[0]!;
}

async function listPullRequests(options: {
	head?: string;
	author?: '@me' | string;
}) {
	const args: string[] = [];

	options.head && args.push('--head', options.head);
	options.author && args.push('--author', options.author);

	const json = await runAndCapture(
		'gh',
		'pr',
		'list',
		...args,
		'--json',
		'title,body,number,isDraft,commits,headRefName,baseRefName',
	);
	const prs: Array<PullRequest> = JSON.parse(json);

	if (!Array.isArray(prs)) {
		log.error('Invalid response from gh cli:', prs);
		return [];
	}
	// Replace CRLF with LF, GUM editor doesnt like CRLF (and neither do I)
	return prs.map((pr) => ({ ...pr, body: pr.body.replaceAll('\r\n', '\n') }));
}
