This codemod migrates imports from JSON modules that use named exports to use default exports instead.

This codemod transforms named imports from JSON files into default imports, adhering to the new ECMAScript specification and Webpack v5 compatibility. Named imports from JSON modules are no longer supported.

## Example

### Before

```ts
import { version } from "./package.json";
console.log(version);
```

### After

```ts
import pkg from "./package.json";
console.log(pkg.version);
```
