#!/usr/bin/env bash

set -eu

START_DIR=$PWD

rm -rf upstream origin local

# UPSTREAM
mkdir upstream
cd upstream
git init
echo "First commit" >README.md
git add README.md
git commit -m "Initial commit"

# ORIGIN (FORK)
cd "$START_DIR"
git clone "$START_DIR/upstream/.git" origin --origin upstream

# LOCAL
cd "$START_DIR"
git clone "$START_DIR/origin/.git" local --origin origin
cd local
git remote add upstream "$START_DIR/upstream/.git"
