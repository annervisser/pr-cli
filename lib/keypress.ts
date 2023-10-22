import { keypress } from '../deps.ts';
import { CommandExecutionError } from './shell/command-execution-error.ts';

const signalSequences: Record<string, Deno.Signal> = {
	'ctrl+c': 'SIGINT',
	'ctrl+\\': 'SIGQUIT',
	'ctrl+z': 'SIGTSTP',
};

export async function getKeySequence(): Promise<string> {
	const event = await keypress.keypress();

	const parts = [
		event.metaKey ? 'super+' : '',
		event.ctrlKey ? 'ctrl+' : '',
		event.altKey ? 'alt+' : '',
		event.shiftKey ? 'shift+' : '',
		event.key,
	];
	const sequence = parts.join('');

	if (sequence === 'ctrl+c') {
		// Special case for ctrl+c, allowing us to catch and print 'Aborted'
		throw new CommandExecutionError(130);
	}
	if (sequence in signalSequences) {
		Deno.kill(Deno.pid, signalSequences[sequence]);
	}

	return sequence;
}
