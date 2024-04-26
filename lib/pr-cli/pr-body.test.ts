import {
	endMarker,
	formatPullRequestBody,
	replacementExplanation,
	replacePRCLIPartOfBody,
	startMarker,
} from './pr-body.ts';
import { assertEquals } from 'https://deno.land/std@0.207.0/assert/mod.ts';
import { CommitWithBody } from '../git/commit.ts';

Deno.test('No commits', () => {
	assertFormattedEquals(
		[],
		`${startMarker}\n${replacementExplanation}\n\n${endMarker}`,
	);
});

Deno.test('One commit', () => {
	assertFormattedEquals(
		[{
			message: 'Message',
			body: 'Body\nOf\nCommit',
			sha: 'sha',
		}],
		`${startMarker}\n${replacementExplanation}\n#### Message\n\nBody\nOf\nCommit\n${endMarker}`,
	);
});

Deno.test('Indent', () => {
	assertFormattedEquals(
		[{
			message: 'Message',
			body: 'Body\n - Of\n - Commit',
			sha: 'sha',
		}],
		`${startMarker}\n${replacementExplanation}\n#### Message\n\nBody\n - Of\n - Commit\n${endMarker}`,
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
		`${startMarker}\n${replacementExplanation}\n#### Message1\n\nCommit1\nBody\n\n<br>\n\n#### Message2\n\nCommit2\nBody\n${endMarker}`,
	);
});

Deno.test('Replacing pr-cli part of body', () => {
	assertEquals(replacePRCLIPartOfBody('no markers', 'new'), 'new');
	assertEquals(
		replacePRCLIPartOfBody(
			`before start ${startMarker} after end`,
			'new',
		),
		'before start new',
	);
	assertEquals(
		replacePRCLIPartOfBody(
			`before start ${startMarker} between markers ${endMarker} after end`,
			'new',
		),
		'before start new after end',
	);

	assertEquals(
		replacePRCLIPartOfBody(
			`before start\n${startMarker}\nbetween markers\n${endMarker}\nafter end`,
			'new',
		),
		'before start\nnew\nafter end',
	);
});

function assertFormattedEquals(commits: CommitWithBody[], expected: string) {
	assertEquals(formatPullRequestBody(commits), expected);
}
