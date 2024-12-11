import { createElement, Fragment } from "react";

function MyComponent() {
  return createElement("div", null, createElement(Fragment, null, "Hello"));
}
