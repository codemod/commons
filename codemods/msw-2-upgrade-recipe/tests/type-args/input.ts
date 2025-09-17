import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  return res(ctx.json({ firstName: "John" }));
});
