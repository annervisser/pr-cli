import { Commit } from '../../lib/git/git.ts';
import { colors } from 'https://deno.land/x/cliffy@v0.25.4/ansi/colors.ts';
import { runAndCapture, runCommand } from '../../lib/shell/shell.ts';

export interface GitPickSettings {
	fetch: boolean;
	pr: boolean;

	pullRemote: string;
	pushRemote: string;

	branchName: string;
	upstreamBranch: string;

	commits: Commit[];
}

export async function runCherryPick(settings: GitPickSettings): Promise<void> {
	console.log(colors.green('▶️ Creating temporary directory'));
	const tmpDir = await runAndCapture('mktemp', '-d');

	console.log(colors.green(`▶️ Creating temporary worktree in ${tmpDir}`));
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

	console.log(colors.green('▶️ cherry picking commits'));
	const commitSHAsToPick = settings.commits.map((c) => c.sha);
	await runCommand('git', 'cherry-pick', ...commitSHAsToPick);

	console.log(colors.green(`▶️ Pushing to ${settings.pushRemote}/${settings.branchName}`));
	await runCommand('git', 'push', '-u', settings.pushRemote, settings.branchName);

	if (settings.pr) {
		console.log(colors.green('▶️ Creating pull request'));
		await runCommand(
			'gh',
			'pr',
			'create',
			'--fill',
			'--assignee',
			'@me',
			'--base',
			settings.upstreamBranch,
		);
	}

	// TODO still do this if an error occurs
	console.log(colors.green('▶️ Cleaning up temporary worktree'));
	await runCommand('git', 'worktree', 'remove', tmpDir);
}
