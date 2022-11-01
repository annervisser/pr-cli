import { runAndCapture, runCommand } from 'lib/shell/shell.ts';

export interface Commit {
	sha: string;
	message: string;
}

export async function verifyAndExpandCommitSHAs(
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

export async function getCommits(revisionRange: string): Promise<Commit[]> {
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

export async function gitFetch(remote: string): Promise<void> {
	const args = [];
	remote && args.push(remote);
	await runCommand('git', 'fetch', ...args);
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
