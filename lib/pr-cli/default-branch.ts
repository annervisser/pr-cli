import { Git } from '../git/git.ts';

export async function getDefaultBranch(...remotesToTry: string[]): Promise<string> {
	for (const remote of remotesToTry) {
		const head = await Git.getHeadOfRemote(remote);
		if (head) {
			return head;
		}
	}

	throw new Error('Unable to determine default branch, please specify it yourself');
}
