import { slugify, unslugify } from '../slug/slug.ts';
import { Git } from '../git/git.ts';
import { Config } from './config.ts';

export function convertBranchNameToTitle(branchName: string): string {
	let title = unslugify(branchName);
	title = title.charAt(0).toUpperCase() + title.slice(1);

	return title;
}

export function convertToValidBranchName(message: string): string {
	return slugify(message).slice(0, Config.maxBranchNameLength);
}

export async function assertValidBranchName(branchName: string) {
	if (!await Git.isValidBranchName(branchName)) {
		throw new InvalidBranchNameError(`Branch name "${branchName}" is invalid`);
	}
	if (branchName.length > Config.maxBranchNameLength) {
		throw new InvalidBranchNameError(
			`Branch name "${branchName}" exceeds maximum length of ${Config.maxBranchNameLength}`,
		);
	}
}

export async function getDefaultBranch(...remotesToTry: string[]): Promise<string> {
	for (const remote of remotesToTry) {
		const head = await Git.getHeadOfRemote(remote);
		if (head) {
			return head;
		}
	}

	throw new Error('Unable to determine default branch, please specify it yourself');
}

class InvalidBranchNameError extends Error {}
