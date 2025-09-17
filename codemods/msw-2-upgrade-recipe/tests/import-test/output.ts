import { type HttpHandler, HttpResponse, http as caller } from "msw";

const handlers: HttpHandler[] = [
  caller.get("/user", () => {
    return HttpResponse.json({ firstName: "John" });
  }),
];
