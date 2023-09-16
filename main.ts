import { pickCommand } from './commands/pick/pick-command.ts';
import { verifyCommand } from './commands/verify/verify-command.ts';
import { colors, Command, CompletionsCommand, HelpCommand, log, parseFlags } from './deps.ts';
import { pullRequestCommand } from './commands/pull-request/pull-request-command.ts';
import { installDepsCommand } from './commands/install-deps/install-deps-command.ts';
import { getBinDir } from './lib/pr-cli/get-bin-dir.ts';
import { CommandExecutionException } from './lib/shell/shell.ts';

if (import.meta.main) {
	const main = new Command()
		.name('pr-cli')
		.version('0.7.1')
		.option('--debug', 'enable verbose error logging', { global: true })
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
	main.command(installDepsCommand.getName(), installDepsCommand);

	// Prepend our own bin dir to path
	Deno.env.set('PATH', [getBinDir(), Deno.env.get('PATH')].join(':'));

	const debugMode = parseFlags(Deno.args).flags.debug !== undefined;
	setupLogger(debugMode);

	try {
		await main.parse(Deno.args);
	} catch (err) {
		if (err instanceof CommandExecutionException && err.code === 130) {
			log.info('Command Aborted');
		} else {
			log.error(colors.bgRed.brightWhite.bold(` ❗ ${err.message ?? err} `));
			logError(err);
		}
		Deno.exit(1);
	}
}

function logError(err: Error) {
	log.debug(err);
	if (err.cause instanceof Error) {
		log.debug('Caused by: ');
		logError(err.cause);
	}
}

function setupLogger(debugMode: boolean) {
	const logLevel = debugMode ? 'DEBUG' : 'INFO';

	log.setup({
		handlers: {
			default: new log.handlers.ConsoleHandler('NOTSET', { formatter: '{msg}' }), // let handler log everything, decide level on loggers instead
		},
		loggers: {
			default: {
				level: logLevel,
				handlers: ['default'],
			},
		},
	});
}
