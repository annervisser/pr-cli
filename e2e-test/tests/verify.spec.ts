import { expect } from '@playwright/test';
import { test } from '@helpers/cli-test';

test('pr-cli verify', async ({ cli }) => {
	await cli.command('pr-cli verify');
	await expect(cli.lines).toContainText([
		/^\s*gh\s+✗ Not installed*/,
		/^\s*git\s+✔ Installed*/,
		/^\s*gum\s+✔ Installed*/,
	]);

	await cli.assertExitCode(1);
});
