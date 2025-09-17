import { http, HttpResponse } from "msw";

http.get("/user", () => {
  return HttpResponse.json(
    { id: "abc-123" },
    {
      headers: { "X-Custom": "value", "Set-Cookie": "roses=red;violets=blue;" },
    },
  );
});
