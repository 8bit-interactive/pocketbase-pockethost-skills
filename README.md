# PocketBase Skills

This repository contains reusable Codex skills for PocketBase and Pockethost projects.

Its goal is to capture the project-specific knowledge that is easy to forget, expensive to rediscover, or too operational to leave implicit in prompts. Instead of rewriting the same context for each task, the repository packages that context into focused skills with lean instructions, references, and templates.

## Why this repository exists

- Standardize how PocketBase and Pockethost tasks are handled.
- Preserve runtime-specific knowledge such as PocketBase JavaScript and Goja constraints.
- Provide copyable deployment templates for GitHub Actions and Pockethost FTP workflows.
- Provide copyable `Makefile` templates for local PocketBase and Pockethost commands.
- Provide local tooling to download PocketBase binaries and validate migrations before deployment.
- Reduce prompt noise by moving stable operational knowledge into reusable skill folders.

## Current skills

### `pocketbase`

Use this skill for PocketBase application and runtime work, especially:

- PocketBase hooks and migrations
- custom routes and auth flows
- collection design and validation rules
- debugging JavaScript executed by the embedded Goja runtime
- SPA routing served from `pb_public`
- browser-level validation with Playwright and `$playwright-cli`
- downloading the right PocketBase binary for the current platform
- validating migrations locally before deploying to Pockethost
- copyable `Makefile` conventions for `install`, `migrate`, `lint`, `dev`, and `test`

This skill includes references for Goja behavior, SPA routing, local migration testing, and a copyable `Makefile` template.

The default SPA convention is:

- navigation lives under `/page`
- `index.html` stays at the root of `pb_public`
- compiled assets live under `/assets` or `/dist`
- `pb_public/page/` is intentionally discouraged

### `pockethost`

Use this skill for Pockethost hosting and deployment work, especially:

- GitHub Actions FTP deployment
- copyable GitHub Actions workflow templates hosted by this repository
- branch-based staging and production environments
- Makefile-driven `lint`, `test`, `build`, and optional `health` checks
- previous-commit rollback guidance after failed post-deploy health checks
- Pockethost-specific hosting conventions and secrets
- copyable deployment workflow and `Makefile` conventions for local PocketBase tasks and hosted health checks

This skill includes a centralized workflow template, a standalone deployment workflow, a copyable `Makefile`, and deployment guidance for Pockethost.

## GitHub Actions Template

The default Pockethost deployment model is now:

1. keep the deployment template centralized in this repository
2. copy the standalone workflow into the application repository
3. keep environment-specific secrets and vars in the consuming repository
4. rely on branch conventions instead of local workflow customization

The copyable workflow template is published from:

- `pockethost/assets/github-actions-pockethost-deploy.yml`

The default workflow is local to the consuming repository because GitHub Environment-scoped values are resolved reliably there:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'staging' && 'staging' || 'production' }}
```

Default branch mapping:

- `main` -> GitHub Environment `production`
- `master` -> GitHub Environment `production`
- `staging` -> GitHub Environment `staging`

Expected GitHub Environment configuration:

- `POCKETHOST_FTP_USERNAME`
- `POCKETHOST_FTP_PASSWORD`
- `POCKETHOST_TENANT_ID` as an Environment variable or secret

The workflow enforces a simple repository contract:

- if a makefile exists, it must expose `lint`, `test`, and `build`
- if `install` exists, it is run before `lint`, `test`, and `build`
- `health` is optional
- only directories that exist in the repository are deployed

For `pb_public`, the workflow resolves a single FTP target before deployment: it uses `${POCKETHOST_TENANT_ID}/pb_public/` when `POCKETHOST_TENANT_ID` is available, otherwise it uses `pb_public/`.

## Companion Repositories

This repository now has two companion repositories:

- `8bit-interactive/pockethost-tools-demo`: a live consumer repository used to validate the deployment template end-to-end
- `8bit-interactive/pockethost-site-template`: the starter template repository meant to be used via GitHub `Use this template`

The template repository ships with:

- a local deployment workflow copied from this repository
- a `Makefile` matching the shared CI contract
- a `main` branch for production content
- a `staging` branch with distinct placeholder content for easy environment verification
- a zero-build default where most users only edit `pb_public/index.html` and `pb_public/assets/site.css`

Use the template repository when you want a ready-made small-site starting point. Use this repository when you want the shared deployment logic, templates, and skill documentation.

## Repository layout

Each skill lives in its own directory and usually contains:

- `SKILL.md` for activation and core instructions
- `agents/openai.yaml` for UI-facing metadata
- `references/` for detailed documentation loaded only when needed
- `assets/` for reusable templates or files copied into downstream projects

## Intended use

This repository is meant to grow as a focused library of PocketBase and Pockethost operational skills.

New skills should prefer:

- conventions over configuration
- concise `SKILL.md` files
- detailed material in `references/`
- reusable templates in `assets/`
