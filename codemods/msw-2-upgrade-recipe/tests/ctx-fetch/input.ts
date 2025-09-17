import { rest } from "msw";

rest.get("/user", async (req, res, ctx) => {
  const originalRequest = await ctx.fetch(req);
  return res(ctx.json({ firstName: "John" }));
});
