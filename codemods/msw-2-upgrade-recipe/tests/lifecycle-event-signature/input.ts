import { server } from "msw";

server.events.on("request:start", (req, reqId) => {
  doStuff(req, reqId);
});
