import { server } from "msw";

server.events.on("request:start", ({ request, reqId }) => {
  const req = request;
  doStuff(req, reqId);
});
