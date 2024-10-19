import { confirmSettings } from './steps/confirm-settings.ts';
import { runCherryPick } from './steps/git-pick.ts';
import * as log from '@std/log';
import { Git } from '../../lib/git/git.ts';
import { GH, type PullRequest } from '../../lib/github/gh.ts';
import { Gum } from '../../lib/gum/gum.ts';
import {
	assertValidBranchName,
	convertToValidBranchName,
	getDefaultBranch,
} from '../../lib/pr-cli/branch.ts';
import type { Commit } from '../../lib/git/commit.ts';
import { getPullRemote, getPushRemote } from '../../lib/pr-cli/remotes.ts';
import { checkDependencies } from './steps/check-dependencies.ts';
import { ColorScheme } from '../../lib/colors.ts';
import { formatObjectForLog } from '../../lib/pr-cli/debug.ts';
import { chooseMultipleFormatted } from '../../lib/pr-cli/choose.ts';
import { assertValidTitle, selectTitle } from '../../lib/pr-cli/pr-title.ts';
import { generatePullRequestBody, replacePRCLIPartOfBody } from '../../lib/pr-cli/pr-body.ts';
import { Command } from '@cliffy/command';
import { colors } from '@cliffy/ansi/colors';

/** Cliffy's 'depends' construct doesn't work with negatable options, so we have to make the negates conflict instead */
const optionsThatRequirePR = ['draft', 'title'];
const optionsThatDisablePR = ['no-pr', 'no-push'];

export const pickCommand = new Command()
	.name('pick')
	.alias('p')
	.description(
		'cherry-pick specific commits onto a new branch and create a PR for it',
	)
	.group('Toggles')
	.option('--no-fetch', "Don't run git fetch before creating the branch")
	.option('--no-pr', 'Skip creating a pull request on Github', {
		conflicts: optionsThatRequirePR,
	})
	.option('--no-push', 'Skip pushing to push remote (implies --no-pr)', {
		action: (options) => options.pr = false,
		conflicts: optionsThatRequirePR,
	})
	.option('--force', 'Overwrite existing branch, and force push to it')
	.group('Inputs')
	.option('-b, --branch <branchName:string>', 'Name to use for the new branch')
	.option('-B, --base <baseBranch:string>', 'The branch into which you want your code merged')
	.option('-c, --commits <commitSha...:string>', 'Commits to cherry-pick')
	.option('--pull-remote <remote:string>', 'Remote to use for fetching')
	.option('--push-remote <remote:string>', 'Remote to push to')
	.group('Pull request')
	.option('--draft', 'Mark the created pull request as Draft', { conflicts: optionsThatDisablePR })
	.option('--title <title:string>', 'Title for the pull request', {
		conflicts: optionsThatDisablePR,
	})
	.arguments('[baseBranch:string]')
	.help({ hints: false })
	.action(async (options, _baseBranch) => {
		await checkDependencies();

		options.pullRemote ??= await getPullRemote();
		options.pushRemote ??= await getPushRemote();

		if (_baseBranch) {
			await Gum.style([
				await Gum.styleToString(['⚠ Providing a base branch as first argument is deprecated'], {
					foreground: ColorScheme.primary,
					bold: true,
				}),
				`The base branch is now automatically determined, it would be: ${
					colors.brightWhite.bold(await getDefaultBranch(options.pullRemote, options.pushRemote))
				}`,
				`If you still want to specify a different base, use ${
					colors.brightWhite.italic('--base')
				} instead`,
			], {
				border: 'rounded',
				margin: [0, 1],
				padding: [0, 2],
				'border-foreground': ColorScheme.primarySaturated,
				align: 'center',
			});
			options.base ??= _baseBranch;
		}

		options.base ??= await getDefaultBranch(options.pullRemote, options.pushRemote);

		log.debug('Options: ' + formatObjectForLog(options));

		if (options.fetch) {
			log.debug('Running git fetch');
			await Git.fetch(options.pullRemote);
			log.debug('Completed git fetch');
		} else {
			log.info(colors.white('-️ Skipping fetch'));
		}

		const pickedCommits = await parseOrPromptForCommits(
			`${options.pullRemote}/${options.base}`,
			options.commits ?? null,
		);

		if (pickedCommits.length < 1) {
			throw new Error('No commits chosen');
		}

		const title = options.title ?? await selectTitle({
			branchName: options.branch, // This option is only shown if branch was pre-provided
			commits: pickedCommits,
		});
		assertValidTitle(title);
		log.debug(`Using pull request title: ${title}`);

		const branchName = options.branch ?? convertToValidBranchName(title);
		await assertValidBranchName(branchName);

		const remoteBranchExists = await Git.doesBranchExist(`${options.pushRemote}/${branchName}`);
		let existingPullRequestPromise: Promise<PullRequest | null> | null = null;
		if (options.pr && remoteBranchExists) {
			// Start this check early to save some waiting time
			existingPullRequestPromise = GH.getPullRequestInfoForBranch(branchName);
		}

		let overwriteLocalBranch = !!options.force;
		const localBranchExists = await Git.doesBranchExist(branchName);
		if (!overwriteLocalBranch && localBranchExists) {
			overwriteLocalBranch = await Gum.confirm({
				prompt: 'Local branch already exists, do you wish to overwrite it?',
				startOnAffirmative: true,
			});
			log.info(overwriteLocalBranch ? 'Overwriting local branch!' : 'Not overwriting local branch');
		}

		let forcePush = options.force === true;
		if (!forcePush && options.push && remoteBranchExists) {
			forcePush = await Gum.confirm({
				prompt: `Branch on ${options.pushRemote} already exists, do you want to force push?`,
				startOnAffirmative: true,
			});
			log.info(forcePush ? 'Force pushing!' : 'Not force pushing');
		}

		let body = await generatePullRequestBody(pickedCommits);
		log.debug(`Generated pull request body:\n${body}`);

		// This promise is only set if it should be checked, undefined otherwise (await undefined = undefined)
		const existingPR = await existingPullRequestPromise;
		if (existingPR) {
			log.info('PR exists, updating it!');
			body = replacePRCLIPartOfBody(existingPR.body, body);
		}

		const settings = await confirmSettings(
			{
				push: options.push,
				pr: options.pr,
				updatePR: !!existingPR,
				draftPR: options.draft ?? existingPR?.isDraft ?? false,
				pullRemote: options.pullRemote,
				pushRemote: options.pushRemote,
				overwriteLocalBranch,
				forcePush,
				branchName,
				upstreamBranch: options.base,
				commits: pickedCommits,
				title: title,
				body: body,
			},
			{ branchExists: localBranchExists },
		);

		log.info('Go time!');
		await runCherryPick(settings, { existingPR });

		log.info(colors.bgGreen.brightWhite('✔ Done!'));
	});

async function parseOrPromptForCommits(
	upstreamRef: string,
	commitShas: string[] | null,
): Promise<Commit[]> {
	if (commitShas !== null) {
		log.debug('Use provided comments');
		commitShas = await Git.verifyAndExpandCommitSHAs(commitShas);
		return await Git.getCommits(commitShas.join(' '));
	}

	log.debug("Ask user to pick from 'new' commits (local not on remote)");
	const newCommits = await Git.getCommitsToCherryPick(upstreamRef);
	if (newCommits.length < 1) {
		throw new Error('No commits to pick');
	}

	if (newCommits.length === 1) {
		return newCommits;
	}

	const chosenCommits = await chooseMultipleFormatted(
		newCommits,
		(commit) => `${commit.sha}\t${commit.message}`,
		{ header: `Which commits should be cherry-picked? ${colors.dim.white(`(a to select all)`)}` },
	); // select in new-old order
	return chosenCommits.reverse(); // return in old-new order
}
