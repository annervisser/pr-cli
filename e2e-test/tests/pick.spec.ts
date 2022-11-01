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

	await cli.command('pr-cli pick trunk --no-pr');

	// confirm we want to run with missing dependencies (gh cli)
	await expect(cli.lines.getByText('Continue with missing dependencies?')).toBeVisible();
	await cli.type('y');
	await cli.press('Enter');

	// Select commit 1
	await expect(cli.lines.getByText(/^\s*>.*?commit 2/)).toBeVisible();
	await cli.press('ArrowDown'); // move to commit 1
	await cli.press('Enter'); // select commit 1

	// Branch name
	await expect(cli.lines.getByText(/^\s*Branch name:.*commit-1\s*$/)).toBeVisible();
	await cli.type('-branch'); // add some text to branch name
	await cli.press('Enter'); // submit branch name

	await expect(cli.lines).toContainText([
		/About to cherry pick commits:/,
		/commit 1/,
		/Base branch: upstream\/trunk/,
		/Branch name: commit-1-branch/,
		/Continue?/,
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
