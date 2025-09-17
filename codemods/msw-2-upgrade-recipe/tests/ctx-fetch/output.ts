import { http, HttpResponse, bypass } from "msw";

http.get("/user", async ({ request }) => {
  const req = request;
  const originalRequest = await fetch(bypass(req));
  return HttpResponse.json({ firstName: "John" });
});
