This codemod is used to rename the unsafe lifecycle methods to their new names. The following table shows the mapping of the old lifecycle methods to the new ones.

| Old Name | New Name |
|----------|----------|
| componentWillMount | UNSAFE_componentWillMount |
| componentWillReceiveProps | UNSAFE_componentWillReceiveProps |
| componentWillUpdate | UNSAFE_componentWillUpdate |

## Example

### Before

```ts
componentWillMount() {
  console.log("hello");
}

```

### After

```ts
UNSAFE_componentWillMount() {
  console.log("hello");
}
```
