import { dependenciesMet } from '../../verify/verify-command.ts';
import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { Confirm } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/confirm.ts';
import { log } from '../../../deps.ts';

export async function checkDependencies() {
	log.debug('Checking dependencies');
	if (await dependenciesMet()) {
		log.debug('Dependencies met');
		return;
	}

	log.info(colors.red.bold('✗ Missing dependencies, run \'pr-cli verify\' for details'));
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
