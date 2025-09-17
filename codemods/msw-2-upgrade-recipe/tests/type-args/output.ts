import { http, HttpResponse } from "msw";

http.get("/resource", () => {
  return HttpResponse.json({ firstName: "John" });
});
