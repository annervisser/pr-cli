import { chooseCommits } from './steps/choose-commits.ts';
import { confirmSettings } from './steps/confirm-settings.ts';
import { GitPickSettings, runCherryPick } from './steps/git-pick.ts';
import { dependenciesMet } from '../verify/verify-command.ts';
import { colors, Command, Confirm, log } from '../../deps.ts';
import { Commit, Git } from '../../lib/git/git.ts';
import { GH } from '../../lib/github/gh.ts';
import { slugify, unslugify } from '../../lib/slug/slug.ts';
import { Gum } from '../../lib/gum/gum.ts';

/** Cliffy's 'depends' construct doesn't work with negatable options, so we have to make the negates conflict intead */
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
	.option('-c, --commits <commitSha...:string>', 'Commits to cherry-pick')
	.option('--pull-remote <remote:string>', 'Remote to use for fetching')
	.option('--push-remote <remote:string>', 'Remote to push to')
	.group('Pull request')
	.option('--draft', 'Mark the created pull request as Draft', { conflicts: optionsThatDisablePR })
	.option('--title <title:string>', 'Title for the pull request', {
		conflicts: optionsThatDisablePR,
	})
	.arguments('<upstreamBranch:string>') // TODO make optional with default value (or ENV?)
	.action(async (options, upstreamBranch) => {
		log.debug('Checking dependencies');
		if (!await dependenciesMet()) {
			log.info(colors.red.bold('✗ Missing dependencies, run \'pr-cli verify\' for details'));
			const exit = !await Confirm.prompt({
				message: 'Continue with missing dependencies?',
				default: false,
			});
			if (exit) {
				Deno.exit(1);
			}
		}

		options.pullRemote ??= await getPullRemote();
		options.pushRemote ??= await getPushRemote();

		log.debug(options);

		if (options.fetch) {
			log.debug('Running git fetch');
			await Git.fetch(options.pullRemote);
			log.debug('Completed git fetch');
		} else {
			log.info(colors.white('-️ Skipping fetch'));
		}

		const upstreamRef = `${options.pullRemote}/${upstreamBranch}`;

		const pickedCommits = await parseOrPromptForCommits(upstreamRef, options.commits ?? null);

		if (pickedCommits.length < 1) {
			throw new Error('No commits chosen');
		}

		let branchName = options.branch;
		let branchNameSource: string | null = null;
		if (!branchName) {
			({ branchName, source: branchNameSource } = await askForBranchName(pickedCommits));
		}
		await validateBranchName(branchName);

		const localBranchExists = await Git.doesBranchExist(branchName);
		const remoteBranchExists = await Git.doesBranchExist(`${options.pushRemote}/${branchName}`);

		let overwriteLocalBranch = !!options.force;
		if (!overwriteLocalBranch && localBranchExists) {
			overwriteLocalBranch = await Gum.confirm({
				prompt: 'Local branch already exists, do you wish to overwrite it?',
				startOnAffirmative: true,
			});
			log.info(overwriteLocalBranch ? 'Overwriting local branch!' : 'Not overwriting local branch');
		}

		if (options.pr && remoteBranchExists) {
			if (await GH.doesBranchHavePullRequest(branchName)) {
				options.pr = !(await Gum.confirm({
					prompt: 'A pull request for this branch already exists, skip recreating it?',
					startOnAffirmative: true,
				}));
				log.info(options.pr ? 'Trying to create PR anyway!' : 'Skipping PR');
			}
		}

		let forcePush = options.force === true;
		if (!forcePush && options.push && remoteBranchExists) {
			forcePush = await Gum.confirm({
				prompt: `Branch on ${options.pushRemote} already exists, do you want to force push?`,
				startOnAffirmative: true,
			});
			log.info(forcePush ? 'Force pushing!' : 'Not force pushing');
		}

		const body = await generatePullBody(pickedCommits);
		log.debug(`Generated pull request body:\n${body}`);

		const settings: GitPickSettings = {
			push: options.push,
			pr: options.pr,
			draftPR: options.draft ?? false,
			pullRemote: options.pullRemote,
			pushRemote: options.pushRemote,
			overwriteLocalBranch,
			forcePush,
			branchName,
			upstreamBranch,
			commits: pickedCommits,
			title: options.title ?? branchNameSource ?? generatePullTitle(branchName),
			body: await body,
		};
		if (!await confirmSettings(settings, { branchExists: localBranchExists })) {
			log.info('Exiting');
			return;
		}

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
	const newCommits = await Git.getCommits(`${upstreamRef}..`);
	if (newCommits.length < 1) {
		throw new Error('No commits to pick');
	}

	const chosenCommits = await chooseCommits(newCommits); // select in new-old order
	return chosenCommits.reverse(); // return in old-new order
}

function suggestBranchNameForCommitMessage(message: string): string {
	return slugify(message);
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
		prompt: suggestion ? `Branch name: ${colors.dim.white('(Ctrl+U to clear)')} ` : 'Branch name: ',
		placeholder: 'What to call the new branch...',
	});

	const source = branch === suggestion ? suggestionSource : null;
	log.debug(
		source ? 'Suggestion for branch-name was used' : 'Suggestion for branch-name was NOT used',
	);

	return { branchName: branch, source: source };
}

function generatePullTitle(branchName: string): string {
	let title = unslugify(branchName);
	title = title.charAt(0).toUpperCase() + title.slice(1);

	log.debug(`Turned branch name "${branchName}" into title "${title}"`);

	return title;
}

const mdDetailsBlock = (summary: string, details: string) =>
	`<details>
<summary>${summary}</summary>

${details}
</details>`;

async function generatePullBody(commits: Commit[]): Promise<string> {
	const commitsWithBody = await Promise.all(
		commits.map(async (commit) => ({
			...commit,
			body: await Git.getCommitBody(commit.sha),
		})),
	);

	if (commitsWithBody.length === 1) {
		const commit = commitsWithBody[0]!;
		return `${commit.message}\n\n${commit.body}`;
	}

	return commitsWithBody
		.map((commit) =>
			commit.body.trim().length < 1
				? `▹ ${commit.message}`
				: mdDetailsBlock(commit.message, commit.body)
		)
		.join('\n\n---\n');
}

async function validateBranchName(branchName: string) {
	if (!await Git.isValidBranchName(branchName)) {
		throw new Error(`Branch name "${branchName}" is invalid`);
	}
}

async function getPullRemote(): Promise<string> {
	const remotes = await Git.listRemotes();
	const pullRemote = chooseRemote(remotes, ['upstream']);
	if (!pullRemote) {
		throw new Error(
			'Unable to determine what remote to fetch from, please specify it using --pull-remote',
		);
	}
	return pullRemote;
}

async function getPushRemote(): Promise<string> {
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
