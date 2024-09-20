import * as path from '@std/path';

const HOME = Deno.env.get('HOME');

export function getBinDir() {
	if (!HOME) {
		throw new Error('Unable to determine HOME directory');
	}
	return path.join(HOME, '.pr-cli', 'bin');
}
