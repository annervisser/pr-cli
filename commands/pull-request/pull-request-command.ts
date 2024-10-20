import { GH } from '../../lib/github/gh.ts';
import * as log from '@std/log';
import { Git } from '../../lib/git/git.ts';
import { getPullRemote, getPushRemote } from '../../lib/pr-cli/remotes.ts';
import { checkDependencies } from '../pick/steps/check-dependencies.ts';
import { selectTitle } from '../../lib/pr-cli/pr-title.ts';
import { generatePullRequestBody } from '../../lib/pr-cli/pr-body.ts';
import { getDefaultBranch } from '../../lib/pr-cli/branch.ts';
import { Command } from '@cliffy/command';
import { colors } from '@cliffy/ansi/colors';

export const pullRequestCommand = new Command()
	.name('pull-request')
	.alias('pr')
	.description('Create a pull request for the current branch')
	.group('Toggles')
	.option('--no-fetch', "Don't run git fetch before creating the branch")
	.option('--force', 'Overwrite existing branch, and force push to it')
	.option('--web', 'Open the web browser to create a pull request')
	.group('Inputs')
	.option('-b, --branch <branchName:string>', 'Name to use for the new branch')
	.option('-B, --base <baseBranch:string>', 'The branch into which you want your code merged')
	.option('-c, --commits <commitSha...:string>', 'Commits to cherry-pick')
	.option('--pull-remote <remote:string>', 'Remote to use for fetching')
	.option('--push-remote <remote:string>', 'Remote to push to')
	.group('Pull request')
	.option('--draft', 'Mark the created pull request as Draft')
	.option('--title <title:string>', 'Title for the pull request')
	.action(async (options) => {
		await checkDependencies();

		options.pullRemote ??= await getPullRemote();
		options.pushRemote ??= await getPushRemote();
		options.base ??= await getDefaultBranch(options.pullRemote, options.pushRemote);

		const branchName = await Git.getCurrentBranch();

		if (options.fetch) {
			log.debug('Running git fetch');
			await Git.fetch(options.pullRemote);
			log.debug('Completed git fetch');
		} else {
			log.info(colors.white('-️ Skipping fetch'));
		}

		const newCommits = (await Git.getCommits(`${options.pullRemote}/${options.base}..`))
			.reverse(); // return in old-new order

		if (newCommits.length < 1) {
			throw new Error('No new commit on this branch');
		}

		options.title ??= await selectTitle({ commits: newCommits, branchName });
		if (!options.title) {
			throw new Error('Pull request title is empty');
		}
		log.debug(`Using pull request title: ${options.title}`);

		const body = await generatePullRequestBody(newCommits);
		log.debug(`Generated pull request body:\n${body}`);

		await Git.push({
			remote: options.pushRemote,
			branch: branchName,
			force: options.force ?? false,
		});

		await GH.createPullRequest({
			title: options.title,
			body: body,
			baseBranch: options.base,
			draftPR: options.draft ?? false,
			web: options.web ?? false,
		});

		log.info(colors.bgGreen.brightWhite('✔ Done!'));
	});
