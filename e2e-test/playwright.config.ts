import { defineConfig } from '@playwright/test';

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
	use: {
		baseURL: process.env.BASE_URL ?? 'http://localhost:7681/',
		trace: 'retain-on-failure',
		browserName: 'chromium',
	},
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: [
		['html', process.env.DOCKER ? { host: '0.0.0.0' } : {}],
		process.env.CI ? ['github'] : ['list'],
	],
});
