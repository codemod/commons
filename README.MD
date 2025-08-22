# Codemod Commons

Codemods, public or private, are preferred to reside in repositories owned by the main organization of their respective projects.
This repository serves as a catch-all for some codemod sources that still have not found thier way to their ideal home or for Codemod-compatible forks of existing codemods for easier publishing.
Please [chat with us](https://go.codemod.com/community) before making any major contribution.

## Usage

> [!CAUTION]
> These scripts change source code. Commit any unsaved changes before running them. Failing to do so may ruin your day.

To run the transform scripts use [`codemod`](https://go.codemod.com/github) command below:

```console
$ npx codemod <transform> --target <path> [...options]
```

- `transform` - name of transform. see available transforms below.
- `path` - directory to transform. defaults to the current directory.

See the [codemod CLI doc](https://go.codemod.com/cli-docs) for a full list of available commands.

All codemods are also available in the [Codemod Registry](https://go.codemod.com/registry).

## GitHub Action

Use the composite action in this repository to run the Codemod CLI in GitHub Actions:

```yaml
name: Codemod
on:
  workflow_dispatch:
jobs:
  run-codemod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run codemod (dry run)
        uses: codemod-com/commons@v0
        with:
          args: "@codemod-com/your-codemod --dry-run"
```

Notes:
- `inputs.args` is passed to `npx codemod` and defaults to `--version`.
- The Action wraps `npx -y codemod`; no install needed.
- To publish on Marketplace, create a tagged release (e.g., `v0.0.1`) and select "Publish this Action to Marketplace" when drafting the release.
