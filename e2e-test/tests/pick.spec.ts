import { expect } from '@playwright/test';
import { test } from '@helpers/cli-test';

test('pr-cli pick', async ({ cli, _tmpdir }) => {
	// PICK
	await cli.command([
		'~/scripts/setup.sh', // setup repositories
		'cd local',
	]);

	async function createCommit(message: string) {
		await cli.command([
			`echo "${message}" >changes`,
			'git add changes',
			`git commit -m "${message}"`,
		]);
	}

	await createCommit('commit 1');
	await createCommit('commit 2');
	await cli.clear();

	await cli.command('pr-cli pick --no-pr');

	// confirm we want to run with missing dependencies (gh cli)
	await expect(cli.lines.getByText('Continue with missing dependencies?')).toBeVisible();
	await cli.type('y');
	await cli.press('Enter');

	// Select commit 1
	await expect(cli.lines.getByText(/^\s*>.*?commit 2/)).toBeVisible();
	await cli.press('ArrowDown'); // move to commit 1
	await cli.press('Space'); // select commit 1
	await cli.press('Enter'); // Confirm selection

	await expect(cli.lines).not.toContainText([
		'Providing a base branch as first argument is deprecated',
	]);

	// Title
	await expect(cli.lines).toContainText([
		'How do you want to set the pull request title?',
		/> 🔤 {2}Use commit message: commit 1/, // this one should be selected
		/ {2}🖮 {2}Write it yourself/,
	]);
	await cli.press('Enter'); // Confirm selection

	await expect(cli.lines).toContainText([
		/About to cherry pick commits:/,
		/commit 1/,
		/Base branch: upstream\/trunk/,
		/Branch name: origin\/commit-1/,
		/✔ push/,
		/✗ pull request/,
		/ force | pr | push | branch /,
		/Press Enter to continue/,
	]);

	await cli.press('b'); // edit branch
	await expect(cli.lines).toContainText([/Branch name: \(Ctrl\+U to clear\) commit-1/]);
	await cli.type('-branch');
	await cli.press('Enter');

	await expect(cli.lines).toContainText([
		/About to cherry pick commits:/,
		/commit 1/,
		/Base branch: upstream\/trunk/,
		/Branch name: origin\/commit-1-branch/,
		/✔ push/,
		/✗ pull request/,
		/ force | pr | push | branch /,
		/Press Enter to continue/,
	]);

	await cli.press('Enter'); // confirm continue

	await expect(cli.lines.getByText('Done!')).toBeVisible();

	await cli.assertExitCode(0);

	await cli.clear();

	await cli.command(['cd ../origin', 'git checkout commit-1-branch']);
	await expect(cli.lines.getByText("Switched to branch 'commit-1-branch'")).toBeVisible();

	await cli.clear();
	await cli.command('git log -1 --pretty="%s%d"');
	await expect(cli.lines.getByText('commit 1 (HEAD -> commit-1-branch)')).toBeVisible();
});
