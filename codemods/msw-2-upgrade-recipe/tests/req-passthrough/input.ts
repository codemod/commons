import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  return req.passthrough();
});
