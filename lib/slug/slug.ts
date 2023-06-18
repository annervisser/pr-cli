import { slug } from '../../deps.ts';

export function slugify(s: string): string {
	return slug(s, {
		locale: 'uk',
		lower: true,
		trim: true,
		strict: true,
		extends: {},
		remove: undefined,
		replacement: '-',
	});
}
