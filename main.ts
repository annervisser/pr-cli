import { pickCommand } from './commands/pick/pick-command.ts';
import { verifyCommand } from './commands/verify/verify-command.ts';
import { Command, CompletionsCommand, HelpCommand } from 'cliffy/command';
import { colors } from 'cliffy/ansi';
import { parseFlags } from 'cliffy/flags';
import { pullRequestCommand } from './commands/pull-request/pull-request-command.ts';

if (import.meta.main) {
	const main = new Command()
		.name('pr-cli')
		.version('0.3.0')
		.description(
			'Command line utility for quickly creating pull requests on Github',
		)
		.meta('deno', Deno.version.deno)
		.meta('v8', Deno.version.v8)
		.meta('typescript', Deno.version.typescript)
		.default('help');

	// cliffy built-ins
	main.command('help', new HelpCommand());
	main.command('completions', new CompletionsCommand());
	// TODO support upgrade command: https://cliffy.io/docs@v0.25.4/command/build-in-commands#upgrade-command

	// our commands
	main.command(pickCommand.getName(), pickCommand);
	main.command(pullRequestCommand.getName(), pullRequestCommand);
	main.command(verifyCommand.getName(), verifyCommand);

	try {
		await main.parse(Deno.args);
	} catch (err) {
		if (parseFlags(Deno.args).flags.debug === true) {
			console.error(colors.red(err));
		} else if (err instanceof Error) {
			console.error(colors.bgRed.brightWhite.bold(` ❗ ${err.message} `));
		}
		Deno.exit(1);
	}
}
