import { runAndCapture, runVoid } from 'lib/shell/shell.ts';
import { Table } from 'cliffy/table';
import { colors } from 'cliffy/ansi';
import { Command } from 'cliffy/command';

export const verifyCommand = new Command()
	.name('verify')
	.description(
		'Verify installation',
	)
	.action(async () => {
		await printDependencyStatuses();

		if (!await dependenciesMet()) {
			Deno.exit(1);
		}
	});

const dependencies = ['gh', 'git', 'gum'];

export async function dependenciesMet(): Promise<boolean> {
	for (const dependency of dependencies) {
		if (!await binaryExists(dependency)) {
			return false;
		}
	}
	return true;
}

async function printDependencyStatuses() {
	const getStatus = async (binary: string) =>
		await binaryExists(binary) ? colors.green('✔ Installed') : colors.red.bold('✗ Not installed');

	const table = new Table();
	table.header(
		['Program', 'Status', 'Version'].map(colors.bold),
	);
	for (const dependency of dependencies) {
		table.push([dependency, await getStatus(dependency), await getVersion(dependency)]);
	}
	table.padding(2);
	table.render();
}

async function binaryExists(binary: string): Promise<boolean> {
	try {
		await runVoid('env', 'sh', '-c', `command -v ${binary}`);
		return true;
	} catch {
		return false;
	}
}

async function getVersion(binary: string): Promise<string> {
	try {
		const versionOutput = await runAndCapture(binary, '--version');
		return versionOutput.split('\n')[0]!;
	} catch {
		return '<unknown>';
	}
}
