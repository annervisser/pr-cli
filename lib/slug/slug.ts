import { slug } from '@annervisser/slug';

export function slugify(string: string): string {
	// Convert dashes to spaces so slug() retains them
	string = string.replaceAll('-', ' ');

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
