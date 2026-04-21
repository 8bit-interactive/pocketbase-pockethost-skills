# SPA Routing for PocketBase and Pockethost

Use this pattern when the frontend is a client-side SPA served from `pb_public`.

## Recommendation

Prefer an explicit SPA mount path instead of a generic catch-all fallback.

Default contract:

- `GET /` serves `index.html`
- `GET /app/*` serves `index.html`
- `/api/*` remains dedicated to PocketBase APIs and custom backend routes
- existing static files under the `/app` mount should still be served directly from `pb_public`

This is usually simpler and safer than trying to detect whether an arbitrary request should fall back to `index.html`.

## Frontend Implication

The frontend router and frontend asset base should use `/app`.

Examples:

- React Router: `basename="/app"`
- Vite: `base: "/app/"`
- Vue Router: history base `/app`
- other SPA routers: equivalent base URL or mount path setting

If the frontend assumes it lives at `/`, but PocketBase serves it under `/app`, deep links and client-side navigation will be inconsistent.

## PocketBase Hook Example

This example keeps the SPA fallback explicit:

- `/` returns the SPA entrypoint
- `/app` returns the SPA entrypoint
- `/app/*` serves existing files when present and falls back to `index.html` when missing
- `/api/*` is untouched because the SPA route is scoped to `/app`

```javascript
/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/', function (e) {
  return serveSpaIndex(e)
})

routerAdd('GET', '/app', function (e) {
  return serveSpaIndex(e)
})

routerAdd(
  'GET',
  '/app/{path...}',
  $apis.static($os.dirFS($app.rootCmd.rootDir + '/pb_public'), true)
)

function serveSpaIndex(e) {
  return e.fileFS($os.dirFS($app.rootCmd.rootDir + '/pb_public'), 'index.html')
}
```

## Suggested Layout

Typical frontend output:

```text
pb_public/
├── index.html
├── assets/
│   ├── app.js
│   └── app.css
└── favicon.ico
```

Direct asset requests should continue using their real public paths, for example:

- `/app/assets/app.js`
- `/app/assets/app.css`
- `/favicon.ico`

The SPA navigation URLs should live under `/app`, for example:

- `/app`
- `/app/login`
- `/app/settings/profile`

## Why This Pattern

This avoids several common problems:

- no filesystem existence check on every unknown request
- no accidental interception of asset requests
- no accidental rewrite of API traffic to `index.html`
- a clearer separation between backend routes and frontend routes

Using `$apis.static(..., true)` under `/app/{path...}` also delegates the asset-or-index fallback behavior to PocketBase's built-in static handler instead of reimplementing it manually.

## Testing Guidance

Validate the routing behavior with Playwright.

At minimum, cover:

1. `GET /` loads the SPA shell
2. `GET /app` loads the SPA shell
3. `GET /app/some/deep/link` loads the SPA shell
4. `/api/health` or another API route is not rewritten to `index.html`
5. static assets still load from their direct URLs

When the agent drives these tests, prefer `$playwright-cli`.
