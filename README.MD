# Codemod Commons

Codemods, public or private, are preferred to reside in repositories owned by the main organization of their respective projects.
This repository serves as a catch-all for some codemod sources that still have not found thier way to their ideal home or for Codemod-compatible forks of existing codemods for easier publishing.

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
