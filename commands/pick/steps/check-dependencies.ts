import { colors } from '@cliffy/ansi/colors';
import { Confirm } from '@cliffy/prompt';
import * as log from '@std/log';
import { dependenciesMet } from '../../verify/verify-command.ts';

export async function checkDependencies() {
	log.debug('Checking dependencies');
	if (await dependenciesMet()) {
		log.debug('Dependencies met');
		return;
	}

	log.info(colors.red.bold("✗ Missing dependencies, run 'pr-cli verify' for details"));
	const exit = !await Confirm.prompt({
		message: 'Continue with missing dependencies?',
		default: false,
	});
	if (exit) {
		Deno.exit(1);
	} else {
		log.debug('Continuing with missing dependencies');
	}
}
