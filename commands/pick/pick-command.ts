import { confirmSettings } from './steps/confirm-settings.ts';
import { runCherryPick } from './steps/git-pick.ts';
import { colors, Command, log } from '../../deps.ts';
import { Git } from '../../lib/git/git.ts';
import { GH } from '../../lib/github/gh.ts';
import { Gum } from '../../lib/gum/gum.ts';
import {
	assertValidBranchName,
	generatePullRequestBody,
	generatePullRequestTitle,
	suggestBranchNameForCommitMessage,
} from '../../lib/pr-cli/pull-request.ts';
import { Commit } from '../../lib/git/commit.ts';
import { getPullRemote, getPushRemote } from '../../lib/pr-cli/remotes.ts';
import { checkDependencies } from './steps/check-dependencies.ts';
import { getDefaultBranch } from '../../lib/pr-cli/default-branch.ts';
import { ColorScheme } from '../../lib/colors.ts';
import { formatObjectForLog } from '../../lib/pr-cli/debug.ts';
import { chooseMultipleFormatted } from '../../lib/pr-cli/choose.ts';

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
	.option('--no-fetch', 'Don\'t run git fetch before creating the branch')
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

		let branchName = options.branch;
		let branchNameSource: string | null = null;
		if (!branchName) {
			({ branchName, source: branchNameSource } = await askForBranchName(pickedCommits));
		}
		await assertValidBranchName(branchName);

		const remoteBranchExists = await Git.doesBranchExist(`${options.pushRemote}/${branchName}`);
		let doesBranchHavePullRequest: Promise<boolean> | undefined;
		if (options.pr && remoteBranchExists) {
			// Start this check early to save some waiting time
			doesBranchHavePullRequest = GH.doesBranchHavePullRequest(branchName);
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

		// This promise is only set if it should be checked, undefined otherwise (await undefined = undefined)
		if (await doesBranchHavePullRequest) {
			options.pr = !(await Gum.confirm({
				prompt: 'A pull request for this branch already exists, skip recreating it?',
				startOnAffirmative: true,
			}));
			log.info(options.pr ? 'Trying to create PR anyway!' : 'Skipping PR');
		}

		let forcePush = options.force === true;
		if (!forcePush && options.push && remoteBranchExists) {
			forcePush = await Gum.confirm({
				prompt: `Branch on ${options.pushRemote} already exists, do you want to force push?`,
				startOnAffirmative: true,
			});
			log.info(forcePush ? 'Force pushing!' : 'Not force pushing');
		}

		const title = options.title ?? branchNameSource ?? generatePullRequestTitle(branchName);
		log.debug(`Using pull request title: ${title}`);

		const body = await generatePullRequestBody(pickedCommits);
		log.debug(`Generated pull request body:\n${body}`);

		const settings = await confirmSettings(
			{
				push: options.push,
				createPR: options.pr,
				draftPR: options.draft ?? false,
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
		await runCherryPick(settings);

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

	log.debug('Ask user to pick from \'new\' commits (local not on remote)');
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

async function askForBranchName(selectedCommits: Commit[]): Promise<{
	branchName: string;
	source: string | null;
}> {
	let suggestion = undefined;
	let suggestionSource: string | null = null;
	if (selectedCommits.length === 1) {
		log.debug('Generating branch name based on commit message');
		suggestionSource = selectedCommits[0]!.message;
		suggestion = suggestBranchNameForCommitMessage(suggestionSource);
	}

	log.debug('Prompting for branch name');
	const branch = await Gum.input({
		defaultValue: suggestion,
		prompt: 'Branch name: ',
		placeholder: 'What to call the new branch...',
	});

	const source = branch === suggestion ? suggestionSource : null;
	log.debug(
		source ? 'Suggestion for branch-name was used' : 'Suggestion for branch-name was NOT used',
	);

	return { branchName: branch, source: source };
}
