import { expect } from '@playwright/test';
import { test } from '../helpers/cli-test.ts';

test('pr-cli verify', async ({cli}) => {
	await cli.command('pr-cli verify');
	await expect(cli.lines).toContainText([
		/^\s*gh\s+✗ Not installed\s*$/,
		/^\s*git\s+✔ Installed\s*$/,
		/^\s*gum\s+✔ Installed\s*$/,
	]);

	await cli.assertExitCode(1);
});
