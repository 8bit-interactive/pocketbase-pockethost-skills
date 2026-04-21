---
name: pockethost-deployment
description: Use when setting up or updating GitHub Actions CI/CD for Pockethost projects, especially FTP deployment pipelines for PocketBase apps or static sites with branch-based environments, Makefile-driven checks, and previous-commit rollback.
---

# Pockethost Deployment

## Overview

Use this skill for GitHub Actions deployment pipelines targeting Pockethost over FTP.

Prefer a simple branch-to-environment mapping with explicit secrets and a copyable workflow template instead of ad hoc CI logic.

## Workflow

1. Confirm the repository is deployed to Pockethost over FTP.
2. Use GitHub Environments named `production` and `staging`.
3. Store `POCKETHOST_FTP_USERNAME`, `POCKETHOST_FTP_PASSWORD`, and `POCKETHOST_TENANT_ID` in each environment.
4. Copy the workflow template from [assets/github-actions-pockethost-deploy.yml](assets/github-actions-pockethost-deploy.yml).
5. Read [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md) before adapting the template.
6. For local migration validation before deploy, use `$pocketbase-ci-cd`.

## Branch and Environment Rules

- Deploy `main` to `production`.
- Deploy `master` to `production`.
- Deploy `staging` to `staging`.
- Keep the secret names identical across environments.

## Makefile Rules

- If a repository has a `Makefile`, `makefile`, or `GNUmakefile`, the workflow should run `make lint`, `make test`, and `make build` before deployment.
- Treat `lint`, `test`, and `build` as required targets when a makefile exists.
- Treat `health` as an optional target.
- Only run `make health` if the target exists.

## Rollback Rules

- Wait 5 seconds after the FTP upload before running the health check.
- If `make health` fails, rollback by checking out the previous pushed commit for the same branch and re-running the FTP deployment from that commit.
- Treat rollback as best-effort previous-commit restoration, not as transactional release management.

## References

- [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md): Detailed setup notes and workflow behavior.
- [assets/github-actions-pockethost-deploy.yml](assets/github-actions-pockethost-deploy.yml): Ready-to-copy GitHub Actions workflow template.
- `$pocketbase-ci-cd`: Local PocketBase binary download and migration validation workflow.
