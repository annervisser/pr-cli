# PR-CLI

Pretty Rad Cool Lovely Interface\
or\
Pull Request - Command Line Interface

### Installation

- Install deno: https://deno.land/manual/getting_started/installation
- Install Gum:
  - Option 1: manually via https://github.com/charmbracelet/gum
  - Option 2: run `pr-cli install-deps` after installation
- Install GH CLI: https://github.com/cli/cli#installation
- Install pr-cli:

```shell
deno install --name pr-cli \
	--allow-run --allow-read --allow-env \
	--import-map https://deno.land/x/prcli/import_map.json \
 	https://deno.land/x/prcli/main.ts
```

### Links

- https://github.com/charmbracelet/gum
- https://deno.land/x/leaf # To include files in Deno binary?
- https://deno.land/manual/tools/compiler
- https://cliffy.io/docs/command
