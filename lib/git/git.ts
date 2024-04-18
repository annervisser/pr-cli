import { log } from '../../deps.ts';
import { isDebugModeEnabled } from '../pr-cli/debug.ts';
import { runAndCapture, runQuietly } from '../shell/shell.ts';
import { Commit, CommitWithBody } from './commit.ts';

export class Git {
	public static verifyAndExpandCommitSHAs = verifyAndExpandCommitSHAs;
	public static getCommits = getCommits;
	public static getCommitsToCherryPick = getCommitsToCherryPick;
	public static getCommitBody = getCommitBody;
	public static fetch = gitFetch;
	public static push = gitPush;
	public static listRemotes = listRemotes;
	public static doesBranchExist = doesBranchExist;
	public static isValidBranchName = isValidBranchName;
	public static getCurrentBranch = getCurrentBranch;
	public static getHeadOfRemote = getHeadOfRemote;
	public static getHEADCommitSha = getHEADCommitSha;
}

async function verifyAndExpandCommitSHAs(
	commitSHAs: string[],
): Promise<string[]> {
	return await Promise.all(commitSHAs.map(async (commitSHA) => {
		try {
			return await runAndCapture(
				'git',
				'rev-parse',
				'--quiet',
				'--verify',
				`${commitSHA}^{commit}`,
			);
		} catch (e) {
			throw new Error('Given commits are invalid', { cause: e });
		}
	}));
}

async function getCommits(revisionRange: string): Promise<Commit[]> {
	try {
		const result = await runAndCapture(
			'git',
			'show',
			'--quiet',
			'--pretty=format:%h %s',
			revisionRange,
		);

		if (!result) {
			// When no commits found we get an empty string
			return [];
		}

		return result
			.split('\n')
			.map(lineToCommit);
	} catch (e) {
		throw new Error('Failed to retrieve recent commits', { cause: e });
	}
}

/**
 * @see https://git-scm.com/docs/git-cherry
 */
async function getCommitsToCherryPick(upstreamBranch: string): Promise<Commit[]> {
	try {
		const result = await runAndCapture(
			'git',
			'cherry',
			'--abbrev', // get short commit SHAs
			'--verbose', // include commit title in output
			upstreamBranch,
		);

		if (!result) {
			// When no commits found we get an empty string
			return [];
		}

		return result
			.split('\n')
			.filter((line) => line.startsWith('+ ')) // Only takes commits that don't have an equivalent on upstream
			.map((line) => line.slice(2)) // Remove '+ ' from line
			.map(lineToCommit)
			.reverse(); // git cherry returns old->new, return new->old
	} catch (e) {
		throw new Error('Failed to retrieve commits to cherry pick', { cause: e });
	}
}

async function getCommitBody(commit: Commit): Promise<CommitWithBody> {
	try {
		const body = await runAndCapture(
			'git',
			'show',
			'--quiet',
			'--pretty=format:%b',
			commit.sha,
		);
		return {
			...commit,
			body: body.trimEnd(),
		};
	} catch (e) {
		throw new Error(`Failed to retrieve commit body for ${commit.sha}`, { cause: e });
	}
}

function lineToCommit(line: string): Commit {
	// Please note, javascript's String.prototype.split() omits any remaining text when it hits the specific limit,
	// rendering it useless for our purposes here
	const firstSpace = line.indexOf(' ');
	if (firstSpace === -1 || firstSpace === line.length - 1) {
		throw new Error(`unable to parse commit line "${line}"`);
	}
	return {
		sha: line.slice(0, firstSpace),
		message: line.slice(firstSpace + 1),
	};
}

async function gitFetch(remote: string): Promise<void> {
	const args = [];
	remote && args.push(remote);
	await runQuietly('git', 'fetch', ...args);
}

async function gitPush(options: {
	remote: string;
	branch: string;
	force?: boolean;
}) {
	const args = ['-u', options.remote];
	options.force && args.push('--force');
	options.force && args.push('--force-with-lease');
	isDebugModeEnabled() || args.push('--quiet');
	await runQuietly('git', 'push', ...args, options.branch);
}

async function listRemotes(): Promise<string[]> {
	const output = await runQuietly('git', 'remote');
	return output.split('\n').map((line) => line.trim());
}

async function doesBranchExist(branch: string): Promise<boolean> {
	try {
		await revParse(branch, { verify: true });
		return true;
	} catch {
		return false;
	}
}

async function getHEADCommitSha() {
	return await revParse('HEAD');
}

async function revParse(revision: string, options?: { verify?: boolean }) {
	const args: string[] = [];
	options?.verify && args.push('--verify');
	return await runQuietly('git', 'rev-parse', ...args, revision);
}

async function isValidBranchName(branchName: string): Promise<boolean> {
	try {
		await runQuietly('git', 'check-ref-format', '--branch', branchName);
		return true;
	} catch {
		return false;
	}
}

async function getCurrentBranch(): Promise<string> {
	return await runAndCapture('git', 'rev-parse', '--abbrev-ref', 'HEAD');
}

async function getHeadOfRemote(remote: string): Promise<string | null> {
	const pathToRemote = `refs/remotes/${remote}`;
	try {
		const head = await runQuietly('git', 'symbolic-ref', `${pathToRemote}/HEAD`);
		if (!head.startsWith(pathToRemote)) {
			throw new Error('Unexpected return value from git symbolic-ref');
		}
		return head.replace(`${pathToRemote}/`, '');
	} catch (e) {
		log.debug(`Unable to get head of remote '${remote}': ${e}`);
		return null;
	}
}
