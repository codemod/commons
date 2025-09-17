import { http, passthrough } from "msw";

http.get("/resource", () => {
  return passthrough();
});
