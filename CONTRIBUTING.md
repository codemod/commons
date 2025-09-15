# Contributing

Thanks for helping users adopt the latest features with your codemods!

### Before You Open a PR

- **Issue**: Check for an existing issue, or open one first.
- **Safety**: Codemods must be safe, predictable, and idempotent (running twice should not change code again). Avoid mixing patterns with different safety levels.
- **Naming**: In `codemod.yaml`, the codemod name must start with `@<scope>`, where `<scope>` is this repo's GitHub org.
- **Tests**: Add multiple fixtures (positive and negative).
- **Docs**: Update the README for your codemod.

### Development

- Scaffold a new codemod:
  ```bash
  npx codemod@latest init
  ```
- Test your codemod locally;
  ```bash
  cd /path/to/sample/project
  npx codemod workflow run -w /path/to/my-codemod/workflow.yaml
  ```

### Project Layout

- Place all codemods in the `codemods/` directory.

### Checks

- Lint/format: npm run check (Biome)
- Types: npm run typecheck

### Pull Requests

- Describe the codemod and its migration use case.
- Follow Conventional Commits:

| Type     | Usage                                 |
| -------- | ------------------------------------- |
| feat     | New codemod or capability             |
| fix      | Bugfix in a transform or test         |
| docs     | Documentation-only changes            |
| refactor | Non-feature, non-bugfix code changes  |
| test     | Add or update fixtures/tests          |
| chore    | Tooling, CI, formatting, repo hygiene |

### License

By contributing, you agree that your work will be licensed under the MIT License.
