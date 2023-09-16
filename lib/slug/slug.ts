import { slug } from '../../deps.ts';

export function slugify(string: string): string {
	return slug(string, {
		locale: 'uk',
		lower: true,
		trim: true,
		strict: true,
		extends: {},
		remove: undefined,
		replacement: '-',
	});
}

export function unslugify(slug: string): string {
	return slug.replaceAll('-', ' ');
}
