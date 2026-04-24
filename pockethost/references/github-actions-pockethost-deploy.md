# GitHub Actions Deployment for Pockethost

Use this reference when a repository needs a standard GitHub Actions workflow for deploying to Pockethost.

## Current Direction

The preferred model is no longer:

- copy a long workflow
- copy a long `Makefile`
- maintain shell logic in every project

The preferred model is now:

1. scaffold or maintain the project with `pocketbase-pockethost`
2. generate a local workflow in the consuming repository
3. let GitHub Actions call the CLI for `doctor`, `test`, and `deploy`

## Project Conventions

Default conventions:

- `main` -> GitHub Environment `production`
- `master` -> GitHub Environment `production`
- `staging` -> GitHub Environment `staging`
- `pb_public/` is the main static site surface
- `pb_hooks/` and `pb_migrations/` are optional
- `.pb_version` pins the PocketBase version
- `.pb_config.json` is the single explicit project config file

## Required GitHub Environment Configuration

For both `production` and `staging`, configure:

- `POCKETHOST_FTP_USERNAME` as an environment secret
- `POCKETHOST_FTP_PASSWORD` as an environment secret
- `POCKETHOST_TENANT_ID` as an environment variable or secret

Optional:

- `HEALTHCHECK_BASE_URL` as an environment variable when the public URL should not be derived from the tenant ID

## Workflow Behavior

The generated workflow should:

1. check out the repository
2. install Node dependencies
3. run `pocketbase-pockethost doctor --strict --for deploy`
4. run `pocketbase-pockethost test`
5. run `pocketbase-pockethost deploy`

This keeps the workflow very small and pushes the real logic into the CLI.

## Why This Is Better

Compared with the previous shell-heavy approach:

- fewer project files need manual editing
- fewer long workflow branches live in YAML
- local and CI deploys share the same deploy engine
- PocketBase version management moves into `.pb_version`
- GitHub failures become easier to explain because `doctor` fails early with configuration-specific messages

## FTP Deployment Rules

The CLI deploy behavior should stay convention-based:

- `pb_public` uploads to `${POCKETHOST_TENANT_ID}/pb_public/` when a tenant ID is available
- otherwise `pb_public` uploads to `pb_public/`
- `pb_hooks` and `pb_migrations` require a tenant-scoped path

Manual FTP deploy stays supported for users who do not use GitHub.

## Transitional Assets

These files remain in the repository during the transition:

- [../assets/github-actions-pockethost-deploy.yml](../assets/github-actions-pockethost-deploy.yml)
- [../assets/github-actions-pockethost-deploy-standalone.yml](../assets/github-actions-pockethost-deploy-standalone.yml)
- [../assets/Makefile](../assets/Makefile)

Treat them as compatibility material, not the long-term center of the product.
