import { rest } from "msw";

rest.get("/user", (req, res, ctx) => {
  return res(
    ctx.json({ id: "abc-123" }),
    ctx.cookie("roses", "red"),
    ctx.cookie("violets", "blue"),
    ctx.set("X-Custom", "value"),
  );
});
