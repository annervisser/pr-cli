import { colors, log } from '../../../deps.ts';
import { Commit } from '../../../lib/git/commit.ts';
import { Git } from '../../../lib/git/git.ts';
import { GH } from '../../../lib/github/gh.ts';
import { runQuietly } from '../../../lib/shell/shell.ts';
import { sleep } from '../../../lib/sleep.ts';

export type GitPickSettings = Readonly<{
	push: boolean;
	forcePush: boolean;
	overwriteLocalBranch: boolean;

	pullRemote: string;
	pushRemote: string;

	// Cherry-pick settings
	branchName: string;
	upstreamBranch: string;
	commits: Commit[];

	// Pull request settings
	pr: boolean;
	draftPR: boolean;
	updatePR: boolean;
	title: string;
	body: string;
}>;

export async function runCherryPick(settings: GitPickSettings): Promise<void> {
	const cleanupSteps: Array<{ message: string; action: () => unknown | Promise<unknown> }> = [];

	try {
		log.info(colors.green('▶️ Creating temporary directory'));
		const tmpDir = await runQuietly('mktemp', '-d');
		cleanupSteps.push({
			message: colors.green(`▶️ Deleting temporary directory ${tmpDir}`),
			action: async () => await runQuietly('rmdir', tmpDir),
		});

		log.info(colors.green(`▶️ Creating temporary worktree in ${tmpDir}`));
		const upstreamRef = `${settings.pullRemote}/${settings.upstreamBranch}`;
		await runQuietly(
			'git',
			'worktree',
			'add',
			'--no-track',
			settings.overwriteLocalBranch ? '-B' : '-b',
			settings.branchName,
			tmpDir,
			upstreamRef,
		);
		cleanupSteps.pop(); // Leave cleanup of directory to git now
		cleanupSteps.push({
			message: colors.green('▶️ Cleaning up temporary worktree'),
			action: async () => await runQuietly('git', 'worktree', 'remove', '--force', tmpDir),
		});

		Deno.chdir(tmpDir);

		log.info(colors.green('▶️ cherry picking commits'));
		const commitSHAsToPick = settings.commits.map((c) => c.sha);
		await runQuietly('git', 'cherry-pick', ...commitSHAsToPick);

		if (settings.push) {
			log.info(colors.green(`▶️ Pushing to ${settings.pushRemote}/${settings.branchName}`));
			await Git.push({
				remote: settings.pushRemote,
				branch: settings.branchName,
				force: settings.forcePush,
			});
		}

		if (settings.pr) {
			const prSettings = {
				title: settings.title,
				body: settings.body,
				baseBranch: settings.upstreamBranch,
				draftPR: settings.draftPR,
			};
			if (settings.updatePR) {
				await waitForGitHubPRToMatchCommitSHA();

				log.info(colors.green('▶️ Updating pull request'));
				await GH.editPullRequest(prSettings);
			} else {
				log.info(colors.green('▶️ Creating pull request'));
				await GH.createPullRequest(prSettings);
			}
		}
	} finally {
		for (const { message, action } of cleanupSteps.reverse()) {
			log.info(message);
			try {
				await action();
			} catch {
				// ignore
			}
		}
	}
}

async function waitForGitHubPRToMatchCommitSHA() {
	const attempts = 5;

	log.info('Verifying pull request was updated...');
	for (let i = 0; i < attempts; i++) {
		const prInfo = await GH.getPullRequestInfoForCurrentBranch();
		log.debug(`headRefOid of PR ${prInfo.number} is: ${prInfo.headRefOid}`);

		const headSHA = await Git.getHEADCommitSha();
		log.debug(`commit SHA of HEAD is: ${headSHA}`);

		if (!prInfo.headRefOid.startsWith(headSHA)) {
			log.debug(
				`✗ local HEAD (${headSHA}}) does not match with the current PR head (${prInfo.headRefOid})`,
			);
			await sleep(1000);
		} else {
			log.debug(
				`✔ local HEAD (${headSHA}}) matches with the current PR head (${prInfo.headRefOid})`,
			);
			log.info('✔ Changes pushed to PR');
			return;
		}
	}

	log.error(`PR HEAD on GitHub did not match local HEAD after ${attempts} attempts`);
}
