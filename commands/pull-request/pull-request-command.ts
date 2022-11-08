import { Command } from 'cliffy/command';
import { colors } from 'cliffy/ansi';
import { GH } from 'lib/github/gh.ts';
import { log } from 'deps';

export const pullRequestCommand = new Command()
	.name('pull-request')
	.alias('pr')
	.description('Create a pull request for the current branch')
	.arguments('[baseBranch:string]')
	.action(async (_options, upstreamBranch) => {
		await GH.createPullRequest({ baseBranch: upstreamBranch });

		log.info(colors.bgGreen.brightWhite('✔ Done!'));
	});
