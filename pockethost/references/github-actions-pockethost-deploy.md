# GitHub Actions Deployment for Pockethost

Use this reference when a repository needs a standard GitHub Actions workflow for deploying to Pockethost over FTP.

The canonical template lives in:

- [assets/github-actions-pockethost-deploy.yml](../assets/github-actions-pockethost-deploy.yml)

## Deployment Model

This skill standardizes the following rules:

- `main` deploys to the GitHub Environment `production`
- `master` deploys to the GitHub Environment `production`
- `staging` deploys to the GitHub Environment `staging`
- each environment stores the same secret names:
  - `POCKETHOST_FTP_USERNAME`
  - `POCKETHOST_FTP_PASSWORD`
  - `POCKETHOST_TENANT_ID`

The workflow uploads to the Pockethost tenant folder:

```text
./${POCKETHOST_TENANT_ID}/pb_hooks/
./${POCKETHOST_TENANT_ID}/pb_migrations/
./${POCKETHOST_TENANT_ID}/pb_public/
```

## Local Validation Before Deploy

Pockethost deployment and local PocketBase validation solve different problems.

- use this skill for GitHub Actions and FTP deployment to Pockethost
- use `$pocketbase` to download a local PocketBase binary and run migrations before deployment

This split keeps deployment automation simple while still making it easy to validate migration behavior on the current platform before pushing a change.

## Pre-deploy Checks

If the repository contains `Makefile`, `makefile`, or `GNUmakefile`, the workflow treats it as an explicit CI contract and will:

1. verify that `lint`, `test`, and `build` targets exist
2. run `make lint`
3. run `make test`
4. run `make build`

If the repository has no makefile, all Make-based steps are skipped.

`make health` is optional:

- if the target exists, the workflow waits 5 seconds after deployment and runs it
- if the target does not exist, the workflow skips the health check

## Rollback Behavior

Rollback is based on the previous pushed commit of the same branch.

Behavior:

1. deploy the current commit
2. wait 5 seconds
3. if `make health` exists, run it
4. if health fails, checkout `github.event.before`
5. rebuild the previous commit if a makefile exists
6. rerun the same FTP sync steps
7. fail the workflow to keep the failed deployment visible

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

## Adapting the Template

Keep these parts unchanged unless the hosting setup really differs:

- FTP server host: `ftp.pockethost.io`
- secret names
- branch to environment mapping
- tenant-based remote directory layout

Adjust only when needed:

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
POCKETHOST_TENANT_ID
```

The workflow template intentionally uses environment-scoped secrets rather than per-repository suffixed secret names.
