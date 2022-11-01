import type { PlaywrightTestConfig } from '@playwright/test';

/** See https://playwright.dev/docs/test-configuration. */
const config: PlaywrightTestConfig = {
	use: {
		baseURL: process.env.BASE_URL ?? 'http://localhost:7681/',
	},
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: 'html',
};
export default config;
