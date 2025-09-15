# Codemod Commons

Codemods, public or private, are preferred to reside in repositories owned by the main organization of their respective projects.
This repository serves as a catch-all for some codemod sources that still have not found thier way to their ideal home or for Codemod-compatible forks of existing codemods for easier publishing.
Please [chat with us](https://go.codemod.com/community) before making any major contribution.
Community contributions are welcome and appreciated! Check open issues for codemods to build, or open a new one if something’s missing. See the [contribution guide](./CONTRIBUTING.md) for details.

## Running codemods

> [!CAUTION]
> Codemods modify code! Run them only on Git-tracked files, and commit or stash changes first.

### From the registry

Recommended for the best UX. This downloads the package from the [Registry](https://app.codemod.com/registry).

```bash
npx codemod@latest <codemod-name>
```

For example:

```bash
npx codemod@latest @nodejs/tmpDir-to-tmpdir
```

### From source

```bash
npx codemod workflow run -w /path/to/folder/containing/workflow.yaml
```

> \[!NOTE]
> By default, codemods run in the current folder. Add `-t /target/path` to change it.

See the [Codemod docs](https://go.codemod.com/cli-docs) for all CLI commands and options.

## [License](./LICENCE)
