import { slug } from 'https://deno.land/x/slug@v0.1.1/mod.ts';

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
