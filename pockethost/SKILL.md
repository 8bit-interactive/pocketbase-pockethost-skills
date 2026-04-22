---
name: pockethost
description: Use when setting up or updating Pockethost hosting and deployment workflows, especially GitHub Actions FTP deployment, environment secrets, branch-based staging and production, Makefile-driven checks, and previous-commit rollback guidance.
---

# Pockethost

## Overview

Use this skill for hosted deployment and runtime guidance specific to Pockethost.

Prefer a simple branch-to-environment mapping with explicit secrets and a copyable workflow template instead of ad hoc CI logic.

## Workflow

1. Confirm the repository is deployed to Pockethost over FTP.
2. Use GitHub Environments named `production` and `staging`.
3. Store `POCKETHOST_FTP_USERNAME` and `POCKETHOST_FTP_PASSWORD` as environment secrets.
4. Store `POCKETHOST_TENANT_ID` as an environment variable or secret.
5. Copy the standalone workflow template from [assets/github-actions-pockethost-deploy.yml](assets/github-actions-pockethost-deploy.yml).
6. Keep [../.github/workflows/pockethost-deploy.yml](../.github/workflows/pockethost-deploy.yml) only as a centralized reference workflow.
7. Use [assets/Makefile](assets/Makefile) as the default local `Makefile` template when the project needs `install`, `migrate`, `lint`, `dev`, `test`, `build`, and `health` targets.
8. Read [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md) before adapting the template.
9. For PocketBase application logic, hooks, SPA routing, or local migration validation, use `$pocketbase`.

## Deployment Rules

- Deploy `main` to `production`.
- Deploy `master` to `production`.
- Deploy `staging` to `staging`.
- Default to the local workflow template copied from this repository.
- Keep the FTP secret names identical across environments.
- Resolve `POCKETHOST_TENANT_ID` from environment vars before falling back to environment secrets.
- If a makefile exists, require `lint`, `test`, and `build` before deployment.
- If an `install` target exists, run it before `lint`, `test`, and `build`.
- Treat `health` as an optional target and run it only if present.
- If health fails, rollback by redeploying the previous branch commit.
- Keep the SPA routing mount separate from asset directories. If the frontend uses `/page`, bundles still belong under `pb_public/assets` or `pb_public/dist`.

## References

- [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md): Detailed setup notes and workflow behavior.
- [assets/github-actions-pockethost-deploy.yml](assets/github-actions-pockethost-deploy.yml): Canonical standalone workflow template for downstream repositories.
- [../.github/workflows/pockethost-deploy.yml](../.github/workflows/pockethost-deploy.yml): Central reusable GitHub Actions workflow kept as a reference.
- [assets/github-actions-pockethost-deploy-standalone.yml](assets/github-actions-pockethost-deploy-standalone.yml): Alias of the standalone workflow template.
- [assets/Makefile](assets/Makefile): Copyable Makefile template with local PocketBase tasks and optional hosted health checks.
- `$pocketbase`: PocketBase runtime, testing, and local migration validation guidance.
