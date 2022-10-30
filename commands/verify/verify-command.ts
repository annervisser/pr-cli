import { Command } from 'https://deno.land/x/cliffy@v0.25.4/command/mod.ts';
import { Table } from 'https://deno.land/x/cliffy@v0.25.4/table/table.ts';
import { colors } from 'https://deno.land/x/cliffy@v0.25.4/ansi/colors.ts';
import { runVoid } from '../../lib/shell/shell.ts';

export const verifyCommand = new Command()
	.name('verify')
	.description(
		'Verify installation',
	)
	.action(async () => {
		await printDependencyStatuses();
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
		[colors.bold('Program'), colors.bold('Status')],
	);
	for (const dependency of dependencies) {
		table.push([dependency, await getStatus(dependency)]);
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
