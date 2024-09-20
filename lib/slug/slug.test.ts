import { assertEquals } from '@std/assert';
import { slugify } from './slug.ts';

const zwSpace = '\u200b';
const nbSpace = '\u00a0';
const CRLF = `\r\n`;
const LF = `\n`;
const tab = `\t`;

const whitespace = ` ${tab}${LF}${CRLF}${zwSpace}${nbSpace}`;

function testSlugify(name: string, input: string, expected: string, msg?: string) {
	Deno.test(name, () => assertEquals(slugify(input), expected, msg));
}

testSlugify('Empty string', '', '');
testSlugify('Leading/trailing whitespace is removed', whitespace, '');
testSlugify('Whitespace between words is replaced', `hello${whitespace}world`, 'hello-world');
testSlugify(
	'Special characters are removed',
	'"{h}[e](l)>l<o";:,/// \'wo\\r!@#$%^&*_+ld\'!!',
	'hello-world',
);
testSlugify('Characters are lowercased', 'sPoNGEbOb cAsE', 'spongebob-case');
testSlugify('Dashes are preserved', 'kebab-case-branch-name', 'kebab-case-branch-name');
