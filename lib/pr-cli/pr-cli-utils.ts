import * as path from 'https://deno.land/std@0.162.0/path/mod.ts';

const HOME = Deno.env.get('HOME');

export function getBinDir() {
	if (!HOME) {
		throw new Error('Unable to determine HOME directory');
	}
	return path.join(HOME, '.pr-cli', 'bin');
}
