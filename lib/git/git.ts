import { runAndCapture, runCommand, runVoid } from 'lib/shell/shell.ts';

export interface Commit {
	sha: string;
	message: string;
}

export class Git {
	public static verifyAndExpandCommitSHAs = verifyAndExpandCommitSHAs;
	public static getCommits = getCommits;
	public static fetch = gitFetch;
	public static listRemotes = listRemotes;
	public static doesBranchExist = doesBranchExist;
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
		} catch {
			throw new Error('Given commits are invalid');
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
		return result
			.split('\n')
			.map(lineToCommit);
	} catch {
		throw new Error('Failed to retrieve recent commits');
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
	await runCommand('git', 'fetch', ...args);
}

async function listRemotes(): Promise<string[]> {
	const output = await runAndCapture('git', 'remote');
	return output.split('\n').map((line) => line.trim());
}

async function doesBranchExist(branch: string): Promise<boolean> {
	try {
		await runVoid('git', 'rev-parse', '--verify', branch);
		return true;
	} catch {
		return false;
	}
}
