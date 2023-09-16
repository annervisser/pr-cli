import { Git } from '../git/git.ts';

export async function getPullRemote(): Promise<string> {
	const remotes = await Git.listRemotes();
	const pullRemote = chooseRemote(remotes, ['upstream']);
	if (!pullRemote) {
		throw new Error(
			'Unable to determine what remote to fetch from, please specify it using --pull-remote',
		);
	}
	return pullRemote;
}

export async function getPushRemote(): Promise<string> {
	const remotes = await Git.listRemotes();
	const pushRemote = chooseRemote(remotes, ['origin']);
	if (!pushRemote) {
		throw new Error(
			'Unable to determine what remote to fetch from, please specify it using --pull-remote',
		);
	}
	return pushRemote;
}

function chooseRemote(remotes: string[], orderedOptions: string[]): string | undefined {
	if (remotes.length === 1) {
		return remotes[0]!;
	}
	return orderedOptions.find((remote) => remotes.includes(remote));
}
