import { http, HttpResponse } from "msw";

http.get("/user", async ({ request, cookies }) => {
  const req = request;
  const search = new URL(req.url).searchParams;
  const body = await req.clone().json();
  const { thing } = req;
  const userCookies = cookies.user;
  const requestParams = params.thing;
  return HttpResponse.json({ firstName: "John" });
});
