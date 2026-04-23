# GitHub Actions Deployment for Pockethost

Use this reference when a repository needs a standard GitHub Actions workflow for deploying to Pockethost over FTP.

The canonical templates live in:

- [assets/github-actions-pockethost-deploy.yml](../assets/github-actions-pockethost-deploy.yml)
- [assets/github-actions-pockethost-deploy-standalone.yml](../assets/github-actions-pockethost-deploy-standalone.yml)
- [../../.github/workflows/pockethost-deploy.yml](../../.github/workflows/pockethost-deploy.yml)
- [assets/Makefile](../assets/Makefile)

## Default Consumption Model

The default convention is to keep the deployment template centralized in this repository and copy the standalone workflow into the application repository.

Use [assets/github-actions-pockethost-deploy.yml](../assets/github-actions-pockethost-deploy.yml) in downstream repositories.
It is intentionally local to the consuming repository so GitHub Environment-scoped secrets and vars are resolved directly by the job.

This keeps the application repository almost configuration-free:

- branch mapping stays standardized
- FTP deployment behavior stays standardized
- rollback behavior stays standardized
- Makefile contract stays standardized
- FTP sync state files are stored as flat files inside each deployed local directory
- `pb_public` deployment resolves a single remote directory before uploading, which keeps GitHub Actions statuses clean
- improvements to the shared template can be copied from this repository
- the default small-site workflow is zero-build and expects most edits to stay inside `pb_public/`

The standalone alias at [assets/github-actions-pockethost-deploy-standalone.yml](../assets/github-actions-pockethost-deploy-standalone.yml) exists for clarity and mirrors the same template.

## Deployment Model

This skill standardizes the following rules:

- `main` deploys to the GitHub Environment `production`
- `master` deploys to the GitHub Environment `production`
- `staging` deploys to the GitHub Environment `staging`
- each environment stores the same FTP secret names:
  - `POCKETHOST_FTP_USERNAME`
  - `POCKETHOST_FTP_PASSWORD`
- each environment stores `POCKETHOST_TENANT_ID` as a variable or secret

The workflow uploads to the Pockethost tenant folder:

```text
${POCKETHOST_TENANT_ID}/pb_hooks/
${POCKETHOST_TENANT_ID}/pb_migrations/
${POCKETHOST_TENANT_ID}/pb_public/
```

## Local Validation Before Deploy

Pockethost deployment and local PocketBase validation solve different problems.

- use this skill for GitHub Actions and FTP deployment to Pockethost
- use `$pocketbase` to download a local PocketBase binary and run migrations before deployment
- use [assets/Makefile](../assets/Makefile) as the default project contract for `install`, `migrate`, `lint`, `dev`, `test`, `build`, and `health`

This split keeps deployment automation simple while still making it easy to validate migration behavior on the current platform before pushing a change.

## Pre-deploy Checks

If the repository contains `Makefile`, `makefile`, or `GNUmakefile`, the workflow treats it as an explicit CI contract and will:

1. verify that `lint`, `test`, and `build` targets exist
2. run `make install` when that target exists
3. run `make lint`
4. run `make test`
5. run `make build`

If the repository has no makefile, all Make-based steps are skipped.

`make health` is optional:

- if the target exists, the workflow waits 5 seconds after deployment and runs it
- if the target does not exist, the workflow skips the health check
- the default template resolves the instance URL from `HEALTHCHECK_BASE_URL` or `POCKETHOST_TENANT_ID`

## Rollback Behavior

Rollback is based on the previous pushed commit of the same branch.

Behavior:

1. deploy the current commit
2. wait 5 seconds
3. if `make health` exists, run it
4. if health fails, checkout `github.event.before`
5. rerun `make install` if the previous commit exposes that target
6. rebuild the previous commit if a makefile exists
7. rerun the same FTP sync steps
8. fail the workflow to keep the failed deployment visible

Important limitations:

- this is a best-effort restore of the previous branch commit
- it is not a transactional deployment
- on a branch's first push, `github.event.before` may be unavailable or all-zeroes, so rollback cannot run
- rollback reliability depends on the previous commit still building successfully

## Directory Assumptions

The template does not require all deployable folders to exist.

It detects these directories and only uploads the ones present:

- `pb_hooks/`
- `pb_migrations/`
- `pb_public/`

This makes the template usable for:

- PocketBase-only repositories
- frontend-only repositories publishing into `pb_public`
- mixed repositories combining hooks, migrations, and public assets

If the frontend uses the PocketBase SPA routing convention, keep `/page` reserved for navigation and emit compiled files under `pb_public/assets/` or `pb_public/dist/`.

The copyable `Makefile` template enforces this by failing if `pb_public/page/` exists physically.

## Template Contract

The standalone workflow template expects the consuming repository to provide:

- GitHub Environments named `production` and `staging`
- environment secrets named `POCKETHOST_FTP_USERNAME` and `POCKETHOST_FTP_PASSWORD`
- `POCKETHOST_TENANT_ID` as an environment variable or secret

The workflow now validates that configuration early and fails with an explicit GitHub Environment error message when it is incomplete.

By default, the template rejects unsupported branches. The convention is intentionally strict:

- `main` and `master` are the only production branches
- `staging` is the only staging branch

## Central Reusable Workflow

The reusable workflow in [../../.github/workflows/pockethost-deploy.yml](../../.github/workflows/pockethost-deploy.yml) is still kept in this repository as a centralized reference.

Use it only when the consuming repository does not need GitHub Environment-scoped values from the caller.

## Adapting the Template

Keep these parts unchanged unless the hosting setup really differs:

- FTP server host: `ftp.pockethost.io`
- secret names
- branch to environment mapping
- tenant-based remote directory layout

Adjust only when needed:

- repository ref in the caller workflow, preferably pinned to a release tag or commit SHA
- `working-directory` if the application does not live at the repository root
- build implementation inside `make build`
- health logic inside `make health`
- additional exclusions for uploaded directories

## Expected GitHub Configuration

Create these GitHub Environments:

- `production`
- `staging`

Add these secrets to each environment:

```text
POCKETHOST_FTP_USERNAME
POCKETHOST_FTP_PASSWORD
```

Add `POCKETHOST_TENANT_ID` as either:

```text
an Environment variable
or an Environment secret
```

The workflow template intentionally uses environment-scoped configuration rather than per-repository suffixed names.
