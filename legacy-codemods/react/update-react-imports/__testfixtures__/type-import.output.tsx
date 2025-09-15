import type { ComponentProps, ReactElement } from "react";
import { createElement } from "react";

type Props = ComponentProps<"div">;
type Element = ReactElement;

const element = createElement("div");
