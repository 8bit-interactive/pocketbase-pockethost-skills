---
name: pocketbase-pockethost
description: Use when working on PocketBase or Pockethost projects, especially for PocketBase JavaScript hooks, migrations, custom routes, auth flows, collection design, and debugging issues caused by the embedded Goja runtime or hosted-runtime constraints.
---

# PocketBase Pockethost

## Overview

Use this skill for PocketBase and Pockethost codebases.

Prefer PocketBase conventions over custom framework layers. For any server-side JavaScript executed by PocketBase, assume the runtime is Goja, not Node.js or a browser.

## Workflow

1. Identify whether the task touches `pb_hooks`, `pb_migrations`, custom routes, auth hooks, or JavaScript commands executed inside PocketBase.
2. If yes, read [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md) before editing code.
3. If the project serves a SPA from `pb_public`, read [references/spa-routing.md](references/spa-routing.md).
4. Keep the implementation compatible with ES5-era JavaScript and PocketBase runtime APIs.
5. Prefer simple collection rules and explicit type conversions over clever abstractions.
6. Test real app behavior in the browser with Playwright by default.
7. When the agent needs to drive the app directly, use `$playwright-cli`.
8. When Pockethost deployment or runtime behavior is relevant, favor portable assumptions and avoid depending on local process or filesystem behavior.

## PocketBase JavaScript Rules

- Treat PocketBase JavaScript as a constrained runtime.
- Use `var`, function declarations, classic loops, and string concatenation.
- Load local modules inside execution blocks when needed by routes or handlers.
- Prefer `exports.myFunction = myFunction` over `module.exports = { ... }`.
- Use `e.auth` for authenticated records.
- Validate types explicitly before writing to records.
- Use explicit `Boolean(...)`, `Number(...)`, and `String(...)` conversions when setting fields.

## Testing Guidance

- Treat browser testing as a first-class part of PocketBase app work.
- Prefer Playwright by default for end-to-end flows, auth flows, route integration, and UI regressions.
- Use `$playwright-cli` when the agent needs to inspect or exercise the running app in a real browser.
- Keep responsibilities split clearly:
  - Goja guidance covers PocketBase server-side JavaScript behavior.
  - Playwright covers the actual app experience in the browser.
- Do not rely only on hooks or migration validation when the user-facing app behavior also changed.

## SPA Routing Guidance

- For SPA projects, prefer mounting the app under `/app`.
- Serve `index.html` for `GET /`.
- Serve `index.html` for `GET /app/*`.
- Keep `/api/*` reserved for API routes and never mix it with SPA fallback behavior.
- Keep the frontend router basename and asset base URL aligned with `/app`.
- Use [references/spa-routing.md](references/spa-routing.md) for a full PocketBase hook example.

## Pockethost Guidance

- Treat Pockethost as a hosted PocketBase runtime first, not as a generic Node.js host.
- Avoid assumptions about background daemons, local-only paths, or custom process orchestration.
- Keep deployment-sensitive behavior explicit in code and docs.
- Prefer reproducible configuration and portable hooks over environment-specific workarounds.

## References

- [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md): Detailed Goja-specific compatibility notes for PocketBase JavaScript, based on the linked project reference.
- [references/spa-routing.md](references/spa-routing.md): Recommended `/app`-scoped SPA routing pattern with a complete PocketBase hook example.
