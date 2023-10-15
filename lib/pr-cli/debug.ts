export function isDebugModeEnabled(): boolean {
	const value: string = Deno.env.get('DEBUG')?.toLowerCase() ?? 'false';

	if (['true', '1'].includes(value)) {
		return true;
	}

	if (['false', '0'].includes(value)) {
		return false;
	}

	throw new Error('Invalid value for env.DEBUG: ' + value);
}
