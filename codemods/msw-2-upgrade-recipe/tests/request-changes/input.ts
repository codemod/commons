import { rest } from "msw";

rest.get("/user", (req, res, ctx) => {
  const search = req.url.searchParams;
  const { cookies, body: reqBody, thing } = req;
  const userCookies = req.cookies.user;
  const requestParams = req.params.thing;
  return res(ctx.json({ firstName: "John" }));
});
