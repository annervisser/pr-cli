module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	ignorePatterns: ['playwright-report', 'test-results'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:playwright/playwright-test',
		'prettier',
	],
	overrides: [],
	rules: {
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
			},
		],
		'playwright/prefer-to-have-length': 'error',
	},
};
