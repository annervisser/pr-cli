import { expect, Page } from '@playwright/test';

export class CLI {
	root = this.page.locator('div.xterm-accessibility');
	lines = this.root.locator('div[role=listitem]', { hasText: /\S/ }); // \S = any non-whitespace character

	constructor(private readonly page: Page) {}

	lineN(line: number) {
		return this.lines.nth(line);
	}

	async type(text: string) {
		await this.page.keyboard.type(text);
	}

	async press(key: string) {
		await this.page.keyboard.press(key);
	}

	async command(commands: string | string[]): Promise<void> {
		commands = typeof commands === 'string' ? [commands] : commands;
		for (const command of commands) {
			await this.type(command);
			await this.press('Enter');
		}
	}

	async clear() {
		await this.press('Control+L');
	}

	async assertExitCode(code: number) {
		await this.command('echo $?'); // get exit code
		await expect(this.lineN(-2)).toHaveText(code.toString());
	}
}
