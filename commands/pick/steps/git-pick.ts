import { colors, log } from '../../../deps.ts';
import { Commit } from '../../../lib/git/git.ts';
import { runAndCapture, runCommand } from '../../../lib/shell/shell.ts';
import { GH } from '../../../lib/github/gh.ts';

export interface GitPickSettings {
	push: boolean;
	pr: boolean;
	overwriteLocalBranch: boolean;
	forcePush: boolean;
	draftPR: boolean;

	pullRemote: string;
	pushRemote: string;

	branchName: string;
	upstreamBranch: string;

	commits: Commit[];

	title: string;
	body: string;
}

export async function runCherryPick(settings: GitPickSettings): Promise<void> {
	const cleanupSteps: Array<{ message: string; action: () => void | Promise<void> }> = [];

	try {
		log.info(colors.green('▶️ Creating temporary directory'));
		const tmpDir = await runAndCapture('mktemp', '-d');
		cleanupSteps.push({
			message: colors.green(`▶️ Deleting temporary directory ${tmpDir}`),
			action: async () => await runCommand('rmdir', tmpDir),
		});

		log.info(colors.green(`▶️ Creating temporary worktree in ${tmpDir}`));
		const upstreamRef = `${settings.pullRemote}/${settings.upstreamBranch}`;
		await runCommand(
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
			action: async () => await runCommand('git', 'worktree', 'remove', tmpDir),
		});

		Deno.chdir(tmpDir);

		log.info(colors.green('▶️ cherry picking commits'));
		const commitSHAsToPick = settings.commits.map((c) => c.sha);
		await runCommand('git', 'cherry-pick', ...commitSHAsToPick);

		if (settings.push) {
			log.info(colors.green(`▶️ Pushing to ${settings.pushRemote}/${settings.branchName}`));
			const args = ['-u', settings.pushRemote];
			settings.forcePush && args.push('--force');
			await runCommand('git', 'push', ...args, settings.branchName);
		}

		if (settings.pr) {
			log.info(colors.green('▶️ Creating pull request'));
			// Check if a pr is already open, using: `gh api "/repos/{owner}/{repo}/pulls?state=all&head={owner}:install-deps-command-for-gum" -q ".[] | {url}"`
			await GH.createPullRequest({
				title: settings.title,
				body: settings.body,
				baseBranch: settings.upstreamBranch,
				draftPR: settings.draftPR,
			});
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
