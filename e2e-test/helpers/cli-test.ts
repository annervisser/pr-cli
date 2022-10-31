import { expect, test as base } from '@playwright/test';
import { CLI } from './CLI.ts';

export const test = base.extend<{ cli: CLI, _tmpdir: void }>({
	cli: async ({page}, use) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/bash/);
		const cli = new CLI(page);
		await use(cli);
	},
	_tmpdir: async ({cli}, use) => {
		await cli.command('TMPDIR="$(mktemp -d)"');
		await cli.command('cd "$TMPDIR"');
		await cli.clear();
		await use(undefined);
		await cli.command('rm -rf "$TMPDIR"');
	},
});
