import { Command } from 'https://deno.land/x/cliffy@v0.25.4/command/mod.ts';
import { Commit, getCommits, verifyAndExpandCommitSHAs } from '../../lib/git/git.ts';
import { input } from '../../lib/gum/gum.ts';
import { slugify } from '../../lib/slug/slug.ts';
import { chooseCommits } from './choose-commits.ts';
import { confirmSettings } from './steps/confirm-settings.ts';
import { GitPickSettings, runCherryPick } from './git-pick.ts';

export const pickCommand = new Command()
	.name('pick')
	.alias('p')
	.description(
		'cherry-pick specific commits onto a new branch and create a PR for it',
	)
	.option('--no-fetch', 'Don\'t run git fetch before creating the branch')
	.option('--no-pr', 'Skip creating a pull request on Github')
	.option('-b, --branch <branchName:string>', 'Name to use for the new branch')
	.option('-c, --commits <commitSha...:string>', 'Commits to cherry-pick')
	.option('--pull-remote <remote:string>', 'Remote to use for fetching', {
		default: 'upstream',
	})
	.option('--push-remote <remote:string>', 'Remote to push to', {
		default: 'origin',
	})
	.arguments('<upstreamBranch:string>') // TODO make optional with default value (or ENV?)
	.action(async (options, upstreamBranch) => {
		console.debug('Pick command called with options:', options);

		const upstreamRef = `${options.pullRemote}/${upstreamBranch}`;

		const pickedCommits = await parseCommits(upstreamRef, options.commits ?? null);
		console.debug('picked commits:', pickedCommits);

		if (pickedCommits.length < 1) {
			throw new Error('No commits chosen');
		}

		const branchName = options.branch ?? await askForBranchName(pickedCommits);
		validateBranchName(branchName);

		const settings: GitPickSettings = {
			...options,
			branchName,
			upstreamBranch,
			commits: pickedCommits,
		};
		if (
			!await confirmSettings(settings)
		) {
			console.log('Exitting');
			return;
		}
		console.log('Go time!');
		await runCherryPick(settings);
	});

async function parseCommits(
	upstreamRef: string,
	commitShas: string[] | null,
): Promise<Commit[]> {
	if (commitShas !== null) {
		// Use provided comments
		commitShas = await verifyAndExpandCommitSHAs(commitShas);
		return await getCommits(commitShas.join(' '));
	}

	// Ask user to pick from 'new' commits (local not on remote)
	const newCommits = (await getCommits(`${upstreamRef}..`)).reverse(); // getCommits(upstream/develop..) returns commits new-old we want to process them old-new
	if (newCommits.length < 1) {
		throw new Error('No commits to pick');
	}

	return await chooseCommits(newCommits);
}

function suggestBranchNameForCommitMessage(message: string): string {
	return slugify(message);
}

async function askForBranchName(selectedCommits: Commit[]): Promise<string> {
	let suggestion = undefined;
	if (selectedCommits.length === 1) {
		suggestion = suggestBranchNameForCommitMessage(selectedCommits[0]!.message);
		console.debug('suggesting branch name', suggestion);
	}

	// @TODO prompt color
	return await input({
		defaultValue: suggestion,
		prompt: suggestion ? 'Branch name: (Ctrl+U to clear) ' : 'Branch name: ',
		placeholder: 'What to call the new branch...',
	});
}

function validateBranchName(branchName: string) {
	const minLength = 3;
	if (branchName.length < minLength) {
		throw new Error(`Branch name should be at least ${minLength} characters long`);
	}
}
