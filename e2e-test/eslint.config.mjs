import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import eslintConfigPrettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';

/** @type { import("eslint").Linter.Config[] } */
export default [
	includeIgnoreFile(`${import.meta.dirname}/.gitignore`),
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		languageOptions: { globals: globals.node },
	},
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	pluginJs.configs.recommended,
	eslintConfigPrettier,
	playwright.configs['flat/recommended'],
	...tseslint.configs.strictTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],
		},
	},
];
