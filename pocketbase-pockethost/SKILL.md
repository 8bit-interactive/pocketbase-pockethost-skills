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
3. Keep the implementation compatible with ES5-era JavaScript and PocketBase runtime APIs.
4. Prefer simple collection rules and explicit type conversions over clever abstractions.
5. When Pockethost deployment or runtime behavior is relevant, favor portable assumptions and avoid depending on local process or filesystem behavior.

## PocketBase JavaScript Rules

- Treat PocketBase JavaScript as a constrained runtime.
- Use `var`, function declarations, classic loops, and string concatenation.
- Load local modules inside execution blocks when needed by routes or handlers.
- Prefer `exports.myFunction = myFunction` over `module.exports = { ... }`.
- Use `e.auth` for authenticated records.
- Validate types explicitly before writing to records.
- Use explicit `Boolean(...)`, `Number(...)`, and `String(...)` conversions when setting fields.

## Pockethost Guidance

- Treat Pockethost as a hosted PocketBase runtime first, not as a generic Node.js host.
- Avoid assumptions about background daemons, local-only paths, or custom process orchestration.
- Keep deployment-sensitive behavior explicit in code and docs.
- Prefer reproducible configuration and portable hooks over environment-specific workarounds.

## References

- [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md): Detailed Goja-specific compatibility notes for PocketBase JavaScript, based on the linked project reference.
