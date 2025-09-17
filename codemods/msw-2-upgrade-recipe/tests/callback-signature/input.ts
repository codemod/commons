import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  const userCookie = cookies.user;
  const url = new URL(request.url);
  doSomething(url);
  userCookie.doSomething();
  return HttpResponse.json({ id: "abc-123" });
});
