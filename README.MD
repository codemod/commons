# Codemod Commons

Codemods, public or private, are preferred to reside in repositories owned by the main organization of their respective projects.
This repository serves as a catch-all for some codemod sources that still have not found thier way to their ideal home or for Codemod-compatible forks of existing codemods for easier publishing.
Please [chat with us](https://go.codemod.com/community) before making any major contribution.

## Usage

> [!CAUTION]
> These scripts change source code. Commit any unsaved changes before running them. Failing to do so may ruin your day.

To run the transform scripts use [`codemod`](https://go.codemod.com/github) command below:

```console
$ npx codemod <package-name>
```

The `package-name` is name of transform. see available transforms below.
See the [codemod CLI doc](https://go.codemod.com/cli-docs) for a full list of available commands.

All codemods are also available in the [Codemod Registry](https://go.codemod.com/registry).

## Development

Project structures:

```txt
codemods/
├─ project/
│  ├─ recipes/
│  │  ├─ src/
│  │  │  ├─ feature.ts
│  │  ├─ tests/
│  │  │  ├─ input/
│  │  │  │  ├─ case-1.js
│  │  │  │  ├─ case-2.js
│  │  │  │  ├─ case-x.js
│  │  │  ├─ expected/
│  │  │  │  ├─ case-1.js
│  │  │  │  ├─ case-2.js
│  │  │  │  ├─ case-x.js
│  │  ├─ codemod.yaml
│  │  ├─ package.json
│  │  ├─ README.md
│  │  ├─ workflow.yaml
│  ├─ vx-to-vx/
│  │  ├─ codemod.yaml
│  │  ├─ package.json
│  │  ├─ README.md
│  │  ├─ workflow.yaml
utilities/
├─ src/
│  ├─ node-utilisies.ts
├─ package.json
package.json
README.md
```

- `codemods` dir represents the collection of projects
  - `project` is a placeholder for a project name (eg: `react`, `angular`, `vue`, etc)
	- `recipes` is a collection of related codemods (eg: `v18-to-v19`, `react-class-to-function`)
- `utilities` is a internal package that provides shared utilities for codemods (eg: ast-grep queries)

### `codemod.yaml` example

```yaml
schema_version: "1.0"
name: "<project>/<codemod-name>"
version: 1.0.0
description: <Your codemod description>
author: <Your Name>
license: MIT
workflow: workflow.yaml
category: migration

targets:
  languages:
    - javascript
    - typescript

keywords:
  - transformation
  - migration

registry:
  access: public
  visibility: public
```

### `package.json` example

```json
{
	"name": "@<project-name>/<migration-name>",
	"version": "0.0.1",
	"private": true,
	"devDependencies": {
		"@codemod.com/jssg-types": "catalog:"
	},
	"scripts": {
		"test": "npx codemod jssg test -l typescript ./src/workflow.ts ./"
	}
}
```

### `workflow.yaml` example

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/codemod/codemod/refs/heads/main/schemas/workflow.json

version: "1"

nodes:
  - id: apply-transforms
    name: Apply AST Transformations
    type: automatic
    steps:
      - name: Handle DEP0147 via transforming `fs.rmdir` to `fs.rm`.
        js-ast-grep:
          js_file: src/workflow.ts
          base_path: .
          include:
            - "**/*.js"
            - "**/*.jsx"
            - "**/*.mjs"
            - "**/*.cjs"
            - "**/*.cts"
            - "**/*.mts"
            - "**/*.ts"
            - "**/*.tsx"
          exclude:
            - "**/node_modules/**"
          language: typescript
```
