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

,

### Before

```ts
import { version, name, description } from "./package.json";
console.log(version, name, description);
```

### After

```ts
import pkg from "./package.json";
console.log(pkg.version, pkg.name, pkg.description);
```

,

### Before

```ts
import { data } from './config.json';
console.log(data.nested.key, data.anotherKey);
```

### After

```ts
import config from './config.json';
console.log(config.data.nested.key, config.data.anotherKey);
```

,

### Before

```ts
import { key1, key2 } from './config.json';
console.log(key1, key2);
```

### After

```ts
import config from './config.json';
console.log(config.key1, config.key2);
```
