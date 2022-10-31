import { expect } from '@playwright/test';
import { test } from '../helpers/cli-test.ts';

test('Version check', async ({cli}) => {
	await cli.command('pr-cli --version');
	await expect(cli.lineN(1).getByText(/^pr-cli [0-9.]+$/)).toBeVisible();
	await cli.assertExitCode(0);
});
