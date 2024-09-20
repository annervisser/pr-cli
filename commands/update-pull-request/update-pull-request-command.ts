import { GH } from '../../lib/github/gh.ts';
import { checkDependencies } from '../pick/steps/check-dependencies.ts';
import { chooseOneFormatted } from '../../lib/pr-cli/choose.ts';
import { pickCommand } from '../pick/pick-command.ts';
import { Command } from '@cliffy/command';

export const updatePullRequestCommand = new Command()
	.name('update-pull-request')
	.alias('upr')
	.description('Update a pull request by force pushing some local commits')
	.action(async () => {
		await checkDependencies();

		const prs = await GH.listPullRequests({ author: '@me' });
		if (prs.length < 1) {
			throw new Error('No pull requests to update');
		}

		const pr = await chooseOneFormatted(
			prs,
			(pr) => pr.title,
			{
				header: 'What PR do you want to update?',
			},
		);

		await pickCommand.parse([
			'--branch',
			pr.headRefName,
			'--base',
			pr.baseRefName,
			'--title',
			pr.title,
		]);
	});
