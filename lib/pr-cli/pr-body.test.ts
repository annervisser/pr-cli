import { formatCommits } from './pr-body.ts';
import { assertEquals } from 'https://deno.land/std@0.207.0/assert/mod.ts';
import { CommitWithBody } from '../git/commit.ts';

Deno.test('No commits', () => {
	assertFormattedEquals(
		[],
		'',
	);
});

Deno.test('One commit', () => {
	assertFormattedEquals(
		[{
			message: 'Message',
			body: 'Body\nOf\nCommit',
			sha: 'sha',
		}],
		'#### ▹ Message\n\nBody\nOf\nCommit',
	);
});

Deno.test('Indent', () => {
	assertFormattedEquals(
		[{
			message: 'Message',
			body: 'Body\n - Of\n - Commit',
			sha: 'sha',
		}],
		'#### ▹ Message\n\nBody\n - Of\n - Commit',
	);
});

Deno.test('Multiple commits', () => {
	assertFormattedEquals(
		[{
			message: 'Message1',
			body: 'Commit1\nBody',
			sha: 'sha1',
		}, {
			message: 'Message2',
			body: 'Commit2\nBody',
			sha: 'sha2',
		}],
		'#### ▹ Message1\n\nCommit1\nBody\n\n---\n\n#### ▹ Message2\n\nCommit2\nBody',
	);
});

function assertFormattedEquals(commits: CommitWithBody[], expected: string) {
	assertEquals(formatCommits(commits), expected);
}
