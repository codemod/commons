import React from "react";

function MyComponent() {
  return React.createElement(
    "div",
    null,
    React.createElement(React.Fragment, null, "Hello")
  );
}
