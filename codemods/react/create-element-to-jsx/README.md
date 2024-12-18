This codemod transforms React.createElement calls into JSX syntax, making your code more readable and maintainable.

## Example

### Before

```tsx
return React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Hello World"),
  React.createElement("p", { style: { color: "blue" } }, "Welcome to React")
);
```

### After

```tsx
return (
  <div className="container">
    <h1>Hello World</h1>
    <p style={{ color: "blue" }}>Welcome to React</p>
  </div>
);
```
