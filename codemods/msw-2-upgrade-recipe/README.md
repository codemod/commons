# msw-2-upgrade-recipe

Transform MSW v1 code to v2 patterns

## Installation

```bash
# Install from registry
codemod run msw-2-upgrade-recipe

# Or run locally
codemod run -w workflow.yaml
```

## Usage

This codemod transforms TypeScript code by upgrading your project from MSW v1 to v2. The codemod automatically handles all major breaking changes:

- Updates import statements to new locations and names
- Fixes generic type arguments order
- Modernizes request object usage patterns
- Replaces `ctx.fetch()` with new `fetch(bypass())` pattern
- Updates passthrough method calls
- Converts response patterns to new `HttpResponse` API
- Updates handler callback signatures
- Modernizes event callback signatures
- Replaces deprecated handler printing methods

## Transformations Applied

### 1. Import Updates (`imports`)

Updates import statements to match MSW v2 locations and naming:

- `rest` → `http`
- `RestHandler` → `HttpHandler`
- `setupWorker` now imported from `msw/browser`

**Before:**

```typescript
import { rest as caller, RestHandler } from "msw";

const handlers: RestHandler[] = [
  caller.get("/user", (req, res, ctx) => {
    return res(ctx.json({ firstName: "John" }));
  }),
];
```

**After:**

```typescript
import { http as caller, HttpHandler, HttpResponse } from "msw";

const handlers: HttpHandler[] = [
  caller.get("/user", () => {
    return HttpResponse.json({ firstName: "John" });
  }),
];
```

### 2. Context Fetch (`ctx-fetch`)

Replaces `ctx.fetch(req)` with `fetch(bypass(req))`:

**Before:**

```typescript
import { rest } from "msw";

rest.get("/user", async (req, res, ctx) => {
  const originalRequest = await ctx.fetch(req);
  return res(ctx.json({ firstName: "John" }));
});
```

**After:**

```typescript
import { bypass, http, HttpResponse } from "msw";

http.get("/user", async ({ request }) => {
  let req = request;
  const originalRequest = await fetch(bypass(req));
  return HttpResponse.json({ firstName: "John" });
});
```

### 3. Request Passthrough (`req-passthrough`)

Updates passthrough calls to use the exported function:

**Before:**

```typescript
import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  return req.passthrough();
});
```

**After:**

```typescript
import { http, passthrough } from "msw";

http.get("/resource", () => {
  return passthrough();
});
```

### 4. Request Changes (`request-changes`)

Modernizes request object usage patterns:

- `req.url` → `new URL(request.url)`
- `req.params` → direct destructuring from callback argument
- `req.cookies` → direct destructuring from callback argument
- `req.body` → removed (use `request.json()` instead)

**Before:**

```typescript
import { rest } from "msw";

rest.get("/user", (req, res, ctx) => {
  const search = req.url.searchParams;
  const { cookies, body: reqBody, thing } = req;
  const userCookies = req.cookies.user;
  const requestParams = req.params.thing;
  return res(ctx.json({ firstName: "John" }));
});
```

**After:**

```typescript
import { http, HttpResponse } from "msw";

http.get("/user", async ({ request, cookies }) => {
  let req = request;
  const search = new URL(req.url).searchParams;
  const body = await req.clone().json();
  const { thing } = req;
  const userCookies = cookies.user;
  const requestParams = params.thing;
  return HttpResponse.json({ firstName: "John" });
});
```

### 5. Response Usage (`response-usages`)

Converts old response patterns to new `HttpResponse` API:

**Before:**

```typescript
import { rest } from "msw";

rest.get("/user", (req, res, ctx) => {
  return res(
    ctx.json({ id: "abc-123" }),
    ctx.cookie("roses", "red"),
    ctx.cookie("violets", "blue"),
    ctx.set("X-Custom", "value")
  );
});
```

**After:**

```typescript
import { http, HttpResponse } from "msw";

http.get("/user", () => {
  return HttpResponse.json(
    { id: "abc-123" },
    {
      headers: { "X-Custom": "value", "Set-Cookie": "roses=red;violets=blue;" },
    }
  );
});
```

### 6. Callback Signature (`callback-signature`)

Updates handler callback signatures and removes unused variables:

**Before:**

```typescript
import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  const userCookie = cookies.user;
  const url = new URL(request.url);
  doSomething(url);
  userCookie.doSomething();
  return HttpResponse.json({ id: "abc-123" });
});
```

**After:**

```typescript
import { http, HttpResponse } from "msw";

http.get("/resource", ({ request, cookies }) => {
  let req = request;
  const userCookie = cookies.user;
  const url = new URL(req.url);
  doSomething(url);
  userCookie.doSomething();
  return HttpResponse.json({ id: "abc-123" });
});
```

### 7. Lifecycle Events (`lifecycle-events-signature`)

Updates lifecycle event callback signatures:

**Before:**

```typescript
import { server } from "msw";

server.events.on("request:start", (req, reqId) => {
  doStuff(req, reqId);
});
```

**After:**

```typescript
import { server } from "msw";

server.events.on("request:start", ({ request, reqId }) => {
  let req = request;
  doStuff(req, reqId);
});
```

### 8. Print Handlers (`print-handler`)

Replaces deprecated `printHandlers()` with new method:

**Before:**

```typescript
worker.printHandlers();
```

**After:**

```typescript
worker.forEach((handler) => {
  console.log(handler.info.header);
});
```

### 9. Type Arguments (`type-args`)

Fixes generic type argument order for type safety:

**Before:**

```typescript
import { rest } from "msw";

rest.get("/resource", (req, res, ctx) => {
  return res(ctx.json({ firstName: "John" }));
});
```

**After:**

```typescript
import { http, HttpResponse } from "msw";

http.get("/resource", () => {
  return HttpResponse.json({ firstName: "John" });
});
```

## Important Notes

⚠️ **Custom Factory Functions**: This codemod does not change signatures of MSW handlers when called through custom factory functions. You'll need to update these manually.

⚠️ **Request Body Usage**: If you were using `req.body`, the codemod assumes you want `await request.json()`. You may need to adjust for other body types manually.

⚠️ **Complete Migration**: This codemod performs all necessary transformations in the correct order to ensure your code properly migrates to MSW v2.

## Development

```bash
# Test the transformation
npm test

# Validate the workflow
codemod validate -w workflow.yaml

# Publish to registry
codemod login
codemod publish
```

## Resources

- [MSW v2 Migration Guide](https://mswjs.io/docs/migrations/1.x-to-2.x)
- [MSW v2 Documentation](https://mswjs.io/docs)

## License

MIT
