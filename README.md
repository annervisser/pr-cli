# PR-CLI

Pull Request - Command Line Interface

## Installation

- Install Deno: https://deno.land/manual/getting_started/installation
- Install GitHub CLI: https://github.com/cli/cli#installation
- Install pr-cli:

```shell
deno install --name pr-cli --allow-run --allow-read --allow-env https://deno.land/x/prcli/main.ts
```

- Install Gum:

```shell
pr-cli install-deps
```

Or manually: https://github.com/charmbracelet/gum#installation

### Completions

To get completions for pr-cli, add this to your `.bashrc`:

```shell
source <(pr-cli completions bash)
```

For other shells run `pr-cli completions --help` for instructions
