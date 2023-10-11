# PR-CLI

Pull Request - Command Line Interface

## Installation

- Install prerequisites:
  > ℹ️ Check if you already have these installed by running `deno --version` and `gh --version`
  - Deno: https://deno.land/manual/getting_started/installation
  - GitHub CLI: https://github.com/cli/cli#installation
- Install pr-cli:

  ```shell
  deno install --name pr-cli --allow-run --allow-read --allow-env https://deno.land/x/prcli/main.ts
  ```

- Install Gum:

  ```shell
  pr-cli install-deps
  ```

  > ℹ️ you can also install Gum manually if you prefer:
  > https://github.com/charmbracelet/gum#installation

### Completions

To get completions for pr-cli in bash, run this::

```shell
echo 'source <(pr-cli completions bash)' >> ~/.bashrc
```

> ℹ This will add `source <(pr-cli completions bash)` at the end of your .bashrc file

For other shells run `pr-cli completions --help` for instructions
