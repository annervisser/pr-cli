import { Commit } from 'lib/git/git.ts';
import { runAndCapture, runCommand } from 'lib/shell/shell.ts';
import { colors } from 'cliffy/ansi';
import { GH } from 'lib/github/gh.ts';
import { log } from 'deps';

export interface GitPickSettings {
	push: boolean;
	fetch: boolean;
	pr: boolean;

	pullRemote: string;
	pushRemote: string;

	branchName: string;
	upstreamBranch: string;

	commits: Commit[];
}

export async function runCherryPick(settings: GitPickSettings): Promise<void> {
	log.info(colors.green('▶️ Creating temporary directory'));
	const tmpDir = await runAndCapture('mktemp', '-d');

	log.info(colors.green(`▶️ Creating temporary worktree in ${tmpDir}`));
	const upstreamRef = `${settings.pullRemote}/${settings.upstreamBranch}`;
	await runCommand(
		'git',
		'worktree',
		'add',
		'--no-track',
		'-b',
		settings.branchName,
		tmpDir,
		upstreamRef,
	);

	Deno.chdir(tmpDir);

	log.info(colors.green('▶️ cherry picking commits'));
	const commitSHAsToPick = settings.commits.map((c) => c.sha);
	await runCommand('git', 'cherry-pick', ...commitSHAsToPick);

	if (settings.push) {
		log.info(colors.green(`▶️ Pushing to ${settings.pushRemote}/${settings.branchName}`));
		await runCommand('git', 'push', '-u', settings.pushRemote, settings.branchName);
	}

	if (settings.pr) {
		log.info(colors.green('▶️ Creating pull request'));
		await GH.createPullRequest({ baseBranch: settings.upstreamBranch });
	}

	// TODO still do this if an error occurs
	log.info(colors.green('▶️ Cleaning up temporary worktree'));
	await runCommand('git', 'worktree', 'remove', tmpDir);
}
