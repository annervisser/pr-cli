#!/usr/bin/env bash

set -eux

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

cleanup() {
    ec=$?
    rm -rf "$tmpdir"
    exit $ec
}

tac() {
	echo hello >> "$1"
	git add "$1"
	git commit "$1" -m "$2"
}

tmpdir=$(mktemp -d)
trap "cleanup" EXIT

gh repo clone "project1" "$tmpdir"
cd "$tmpdir"
tac code.ts "Preparation for feature 1"
tac code.ts "Updated README"
tac bugfix.ts "Quick bugfix"

cd "$SCRIPT_DIR"

DIR="$tmpdir" vhs demo.tape

# Cleanup
gh pr close --repo=annervisser/project1 --delete-branch quick-bugfix
