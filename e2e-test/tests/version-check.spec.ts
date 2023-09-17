import { expect } from '@playwright/test';
import { test } from '@helpers/cli-test';

test('Version check', async ({ cli }) => {
	await cli.command('pr-cli --version');
	await expect(cli.lineN(1).getByText(/^pr-cli [0-9.]{5,}/)).toBeVisible();
	await cli.assertExitCode(0);
});
