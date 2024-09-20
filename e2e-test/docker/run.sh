#!/usr/bin/env sh

set -eu

git config --global user.email "e2e-test-pr-cli@example.com"
git config --global user.name "e2e-test-pr-cli"
git config --global init.defaultBranch trunk

cd /src
deno install --global --name pr-cli \
	--config deno.json --force \
	--allow-run --allow-read --allow-env --no-prompt \
	main.ts
export PATH="/home/docker/.deno/bin:$PATH"

cd
exec env PS1='$ ' \
	ttyd --writable --client-option screenReaderMode=true bash --norc
