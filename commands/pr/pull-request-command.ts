import { Command } from 'cliffy/command';
import { colors } from 'cliffy/ansi';
import { GH } from 'lib/github/gh.ts';

export const pullRequestCommand = new Command()
	.name('pull-request')
	.alias('pr')
	.description('Create a pull request for the current branch')
	.arguments('[upstreamBranch:string]') // TODO make optional with default value (or ENV?)
	.action(async (_options, upstreamBranch) => {
		await GH.createPullRequest({ baseBranch: upstreamBranch });

		console.log(colors.bgGreen.brightWhite('✔ Done!'));
	});
