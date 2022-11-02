import { Commit, Git } from 'lib/git/git.ts';
import { slugify } from 'lib/slug/slug.ts';
import { chooseCommits } from './steps/choose-commits.ts';
import { confirmSettings } from './steps/confirm-settings.ts';
import { GitPickSettings, runCherryPick } from './steps/git-pick.ts';
import { dependenciesMet } from '../verify/verify-command.ts';
import { Command } from 'cliffy/command';
import { colors } from 'cliffy/ansi';
import { Confirm } from 'cliffy/prompt';
import { Gum } from 'lib/gum/gum.ts';

export const pickCommand = new Command()
	.name('pick')
	.alias('p')
	.description(
		'cherry-pick specific commits onto a new branch and create a PR for it',
	)
	.option('--no-fetch', 'Don\'t run git fetch before creating the branch')
	.option('--no-pr', 'Skip creating a pull request on Github')
	.option('--no-push', 'Skip pushing to push remote (implies --no-pr)', {
		action: (options) => options.pr = false,
	})
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
		if (!await dependenciesMet()) {
			console.log(colors.red.bold('✗ Missing dependencies, run \'pr-cli verify\' for details'));
			const exit = !await Confirm.prompt({
				message: 'Continue with missing dependencies?',
				default: false,
			});
			if (exit) {
				Deno.exit(1);
			}
		}

		if (options.fetch) {
			await Git.fetch(options.pullRemote);
		} else {
			console.log(colors.white('-️ Skipping fetch'));
		}

		const upstreamRef = `${options.pullRemote}/${upstreamBranch}`;

		const pickedCommits = await parseOrPromptForCommits(upstreamRef, options.commits ?? null);

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

		console.log(colors.bgGreen.brightWhite('✔ Done!'));
	});

async function parseOrPromptForCommits(
	upstreamRef: string,
	commitShas: string[] | null,
): Promise<Commit[]> {
	if (commitShas !== null) {
		// Use provided comments
		commitShas = await Git.verifyAndExpandCommitSHAs(commitShas);
		return await Git.getCommits(commitShas.join(' '));
	}

	// Ask user to pick from 'new' commits (local not on remote)
	const newCommits = (await Git.getCommits(`${upstreamRef}..`));
	if (newCommits.length < 1) {
		throw new Error('No commits to pick');
	}

	const chosenCommits = await chooseCommits(newCommits); // select in new-old order
	return chosenCommits.reverse(); // return in old-new order
}

function suggestBranchNameForCommitMessage(message: string): string {
	return slugify(message);
}

async function askForBranchName(selectedCommits: Commit[]): Promise<string> {
	let suggestion = undefined;
	if (selectedCommits.length === 1) {
		suggestion = suggestBranchNameForCommitMessage(selectedCommits[0]!.message);
	}

	return await Gum.input({
		defaultValue: suggestion,
		prompt: suggestion ? `Branch name: ${colors.dim.white('(Ctrl+U to clear)')} ` : 'Branch name: ',
		placeholder: 'What to call the new branch...',
	});
}

function validateBranchName(branchName: string) {
	const minLength = 3;
	if (branchName.length < minLength) {
		throw new Error(`Branch name should be at least ${minLength} characters long`);
	}
}
