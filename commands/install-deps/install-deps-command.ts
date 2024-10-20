import { runAndCapture, runCommand } from '../../lib/shell/shell.ts';
import { getBinDir } from '../../lib/pr-cli/get-bin-dir.ts';
import { Command } from '@cliffy/command';
import { colors } from '@cliffy/ansi/colors';
import * as log from '@std/log';
import * as semver from '@std/semver';
import * as path from '@std/path';
import { ensureDir } from '@std/fs/ensure-dir';

interface GithubReleaseAsset {
	name: string;
	browser_download_url: string;
}

interface GithubReleaseResponse {
	tag_name: string;
	name: string;
	published_at: string;
	assets: GithubReleaseAsset[];
}

export const installDepsCommand = new Command()
	.name('install-deps')
	.description('Install dependencies')
	.option('-i, --ignore-system', 'Install, even if system installation is found')
	.option('-f, --force', 'Install, even if current version is the same or a newer version')
	.action(async (options) => {
		const binDir = getBinDir();
		const gumInstall = path.join(binDir, 'gum');

		const pathsToGum = await getExistingGumPaths();
		if (pathsToGum.length) {
			log.info(colors.green(`ℹ found gum installation(s): ${pathsToGum.join(', ')}`));
			if (!options.ignoreSystem && pathsToGum.some((path) => path !== gumInstall)) {
				log.error(colors.brightYellow(
					`Existing gum installation not managed by pr-cli. To install anyway, use --ignore-system`,
				));
				Deno.exit(1);
			}
		}

		const existingGumVersion = await getGumVersion(gumInstall);

		log.info(colors.blue(`Creating ${binDir} if needed`));
		await ensureDir(binDir);

		const osRelease = `${Deno.build.os}_${Deno.build.arch}`;
		log.info(colors.green(`ℹ OS type: ${osRelease}`));

		const latestRelease = await getLatestGumRelease();

		const latestVersion = semver.parse(latestRelease.tag_name);
		log.info(colors.green(`Latest version is ${semver.format(latestVersion)}`));

		if (
			!options.force &&
			semver.isSemVer(existingGumVersion) &&
			semver.greaterOrEqual(existingGumVersion, latestVersion)
		) {
			log.info(colors.brightGreen('Installed version >= the latest version. Nothing to do!'));
			Deno.exit(0);
		}

		log.debug(`Trying to find asset containing ${osRelease} and ending with .tar.gz`);
		const matchedAsset = latestRelease.assets.find(
			(asset) =>
				asset.name.toLowerCase().includes(osRelease.toLowerCase()) &&
				asset.name.endsWith('.tar.gz'),
		);

		if (!matchedAsset) {
			throw new Error('Unable to find matching release file');
		}
		log.info(colors.green(`Found release file ${matchedAsset.name}`));

		log.info(colors.blue(`Downloading...`));
		const tempDir = await Deno.makeTempDir();
		const downloadFilePath = path.join(tempDir, matchedAsset.name);
		const downloadFile = await Deno.open(downloadFilePath, { create: true, write: true });

		const download = await fetch(matchedAsset.browser_download_url);
		if (!download.body) {
			throw new Error('Invalid download response');
		}
		await download.body.pipeTo(downloadFile.writable);

		log.info(colors.blue(`Extracting...`));
		await runCommand('tar', '-xzf', downloadFilePath, '-C', tempDir);

		log.info(colors.blue(`Moving gum binary to ${gumInstall}`));
		await Deno.rename(path.join(tempDir, 'gum'), gumInstall);

		log.info(colors.gray(`Cleaning up in ${tempDir}`));
		await Deno.remove(tempDir, { recursive: true });
	});

async function getExistingGumPaths(): Promise<string[]> {
	let pathToGum: string[] = [];
	try {
		pathToGum = (await runAndCapture('which', '-a', 'gum'))
			.split('\n')
			.filter(Boolean);
	} catch {
		// gum is not in $PATH
	}

	return pathToGum;
}

async function getGumVersion(gumInstall: string): Promise<semver.SemVer | 'none' | 'unknown'> {
	let versionOutput: string | null = null;
	try {
		versionOutput = await runAndCapture(gumInstall, '--version');
	} catch {
		// gum is not installed by us yet
	}

	let existingGumVersion: semver.SemVer | 'unknown' | 'none' = 'none';

	if (versionOutput) {
		const gumVersionOutputRegex = /gum version (?<version>v?[0-9.-]+)(?:$| )/;
		const versionString = gumVersionOutputRegex.exec(versionOutput)?.groups?.version;
		existingGumVersion = versionString !== undefined ? semver.parse(versionString) : 'unknown';
		log.info(colors.green(`ℹ Existing gum installation is version ${existingGumVersion}`));
	} else {
		log.info(colors.green('ℹ No existing gum installation in target directory'));
	}

	return existingGumVersion;
}

async function getLatestGumRelease(): Promise<GithubReleaseResponse> {
	const latestGumReleaseEndPoint = 'https://api.github.com/repos/charmbracelet/gum/releases/latest';
	const ghResponse = await fetch(latestGumReleaseEndPoint);
	if (!ghResponse.ok) {
		const body = await ghResponse.text();
		throw new Error(`Error retrieving gum version from github: [${ghResponse.status}]: ${body}`);
	}
	return await ghResponse.json();
}
