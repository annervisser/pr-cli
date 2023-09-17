export class ColorScheme {
	static primary = '#ff88ff';
	static primarySaturated = '#ff55ff';
	static primaryDarker = '#804480';
}

export function colorTo24Bit(color: string): number {
	return Number(`0x${color.slice(1)}`);
}
