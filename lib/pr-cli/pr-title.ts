import type { Commit } from '../git/commit.ts';
import { convertBranchNameToTitle } from './branch.ts';
import { colors } from '@cliffy/ansi/colors';
import { chooseOneFormatted } from './choose.ts';
import { Gum } from '../gum/gum.ts';

type TitleContext = {
	branchName?: string;
	commits?: Commit[];
	currentTitle?: string;
};

type TitleStrategy = {
	label: string;
	execute: () => Promise<string> | string;
};

export async function writeTitle(context: TitleContext): Promise<string> {
	const manualStrategy = getManualStrategy(context.currentTitle);
	const options: readonly TitleStrategy[] = [
		context.commits ? getCommitStrategy(context.commits) : null,
		context.branchName ? getBranchStrategy(context.branchName) : null,
		manualStrategy,
	].filter((o): o is TitleStrategy => !!o);

	const chosenOption = await chooseOneFormatted(
		options,
		(option) => option.label,
		{
			header: 'How do you want to set the pull request title?',
			selectedOption: context.currentTitle ? manualStrategy : undefined,
		},
	);

	return chosenOption.execute();
}

function getCommitStrategy(commits: Commit[]): TitleStrategy {
	if (commits.length === 1) {
		const commitMessage = commits[0]!.message;
		return {
			label: `🔤  Use commit message: ${colors.dim.white(commitMessage)}`,
			execute: () => commitMessage,
		};
	}

	return {
		label: '🗹  Pick a commit',
		execute: async () => {
			const commit = await chooseOneFormatted(
				commits,
				(commit) => commit.message,
				{ header: 'What commit message do you want to use as title?' },
			);
			return commit.message;
		},
	};
}

function getBranchStrategy(branchName: string): TitleStrategy {
	const titleFromBranchName = convertBranchNameToTitle(branchName);
	return {
		label: `🗠  Use the branch name: ${colors.dim.white(titleFromBranchName)}`,
		execute: () => titleFromBranchName,
	};
}

function getManualStrategy(currentTitle?: string) {
	return {
		label: currentTitle
			? `🖮  Edit current title: ${colors.dim.white(currentTitle)}`
			: '🖮  Write it yourself',
		execute: async () =>
			await Gum.input({
				prompt: 'Pull request title: ',
				defaultValue: currentTitle,
			}),
	};
}

export function assertValidTitle(title: string) {
	if (!title) {
		throw new Error(`Title "${title}" is invalid`);
	}
}
