import { colors, Command, log } from '../../deps.ts';
import { GH } from '../../lib/github/gh.ts';

export const pullRequestCommand = new Command()
	.name('pull-request')
	.alias('pr')
	.description('Create a pull request for the current branch')
	.arguments('[baseBranch:string]')
	.action(async (_options, upstreamBranch) => {
		await GH.createPullRequest({ baseBranch: upstreamBranch, autofill: true });

		log.info(colors.bgGreen.brightWhite('✔ Done!'));
	});
