import { expect } from '@playwright/test';
import { test } from '../helpers/cli-test.ts';

test('Autocompletion', async ({cli}) => {
	await cli.command('source <(pr-cli completions bash)');

	await cli.type('pr-cli verif');
	await cli.press('Tab');
	await expect(cli.lines.last()).toContainText(/pr-cli verify $/);

	await cli.type('--hel');
	await cli.press('Tab');
	await expect(cli.lines.last()).toContainText(/pr-cli verify --help $/);
});
