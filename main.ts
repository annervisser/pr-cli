import { colors } from '@cliffy/ansi/colors';
import { Command } from '@cliffy/command';
import { CompletionsCommand } from '@cliffy/command/completions';
import { HelpCommand } from '@cliffy/command/help';
import { parseFlags } from '@cliffy/flags';
import * as log from '@std/log';
import { installDepsCommand } from './commands/install-deps/install-deps-command.ts';
import { pickCommand } from './commands/pick/pick-command.ts';
import { pullRequestCommand } from './commands/pull-request/pull-request-command.ts';
import {
	updatePullRequestCommand,
} from './commands/update-pull-request/update-pull-request-command.ts';
import { verifyCommand } from './commands/verify/verify-command.ts';
import { isDebugModeEnabled } from './lib/pr-cli/debug.ts';
import { getBinDir } from './lib/pr-cli/get-bin-dir.ts';
import { CommandExecutionError } from './lib/shell/command-execution-error.ts';
import denoConfig from './deno.json' with { type: 'json' };

if (import.meta.main) {
	const main = new Command()
		.name('pr-cli')
		.version(denoConfig.version ?? 'unknown version')
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
	main.command(updatePullRequestCommand.getName(), updatePullRequestCommand);
	main.command(verifyCommand.getName(), verifyCommand);
	main.command(installDepsCommand.getName(), installDepsCommand);

	// Prepend our own bin dir to PATH
	Deno.env.set('PATH', [getBinDir(), Deno.env.get('PATH')].join(':'));

	if (parseFlags(Deno.args).flags.debug !== undefined) {
		Deno.env.set('DEBUG', '1');
	}
	setupLogger();

	try {
		await main.parse(Deno.args);
	} catch (err) {
		if (err instanceof CommandExecutionError && err.code === 130) {
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
	if (err instanceof CommandExecutionError && err.stderr) {
		log.error(err.stderr);
	}
	if (err.cause instanceof Error) {
		log.debug('Caused by: ');
		logError(err.cause);
	}
}

function setupLogger() {
	const logLevel = isDebugModeEnabled() ? 'DEBUG' : 'INFO';

	log.setup({
		handlers: {
			default: new log.ConsoleHandler('NOTSET', {
				formatter: ({ msg }) => `${msg}`,
			}), // let handler log everything, decide level on loggers instead
		},
		loggers: {
			default: {
				level: logLevel,
				handlers: ['default'],
			},
		},
	});
}
