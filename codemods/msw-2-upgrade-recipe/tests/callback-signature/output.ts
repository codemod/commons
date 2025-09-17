import { http, HttpResponse } from "msw";

http.get("/resource", ({ cookies }) => {
  const userCookie = cookies.user;
  const url = new URL(request.url);
  doSomething(url);
  userCookie.doSomething();
  return HttpResponse.json({ id: "abc-123" });
});
