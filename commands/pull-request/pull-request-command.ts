import { colors, Command, log } from '../../deps.ts';
import { GH } from '../../lib/github/gh.ts';
import { Git } from '../../lib/git/git.ts';
import { getPullRemote, getPushRemote } from '../../lib/pr-cli/remotes.ts';
import { getDefaultBranch } from '../../lib/pr-cli/default-branch.ts';
import {
	generatePullRequestBody,
	generatePullRequestTitle,
} from '../../lib/pr-cli/pull-request.ts';

export const pullRequestCommand = new Command()
	.name('pull-request')
	.alias('pr')
	.description('Create a pull request for the current branch')
	.group('Toggles')
	.option('--no-fetch', 'Don\'t run git fetch before creating the branch')
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
		if (newCommits.length === 1) {
			options.title ??= newCommits[0]!.message;
		}

		const title = options.title ?? generatePullRequestTitle(branchName);
		log.debug(`Using pull request title: ${title}`);

		const body = await generatePullRequestBody(newCommits);
		log.debug(`Generated pull request body:\n${body}`);

		await Git.push({
			remote: options.pushRemote,
			branch: branchName,
			force: options.force ?? false,
		});

		await GH.createPullRequest({
			title: title,
			body: body,
			baseBranch: options.base,
			draftPR: options.draft ?? false,
			web: options.web ?? false,
		});

		log.info(colors.bgGreen.brightWhite('✔ Done!'));
	});
