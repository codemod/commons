import { type RestHandler, rest as caller } from "msw";

const handlers: RestHandler[] = [
  caller.get("/user", (req, res, ctx) => {
    return res(ctx.json({ firstName: "John" }));
  }),
];
