# PR-CLI

Pull Request - Command Line Interface

[pr-cli-cropped.webm](https://github.com/annervisser/pr-cli/assets/5613416/59192746-36fd-43a5-85e7-f2a15fb7e449)


## 📥 Installation

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

### ⬆️ Upgrading

To upgrade your installation to the latest version:

```shell
deno install --reload --force --name pr-cli --allow-run --allow-read --allow-env https://deno.land/x/prcli/main.ts
```

### 🔲 Completions

To get completions for pr-cli in bash, run this::

```shell
echo 'source <(pr-cli completions bash)' >> ~/.bashrc
```

> ℹ This will add `source <(pr-cli completions bash)` at the end of your .bashrc file

For other shells run `pr-cli completions --help` for instructions
