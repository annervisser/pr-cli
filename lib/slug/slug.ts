import { slug } from 'slug';

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
