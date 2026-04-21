# PocketBase Skills

This repository contains reusable Codex skills for PocketBase and Pockethost projects.

Its goal is to capture the project-specific knowledge that is easy to forget, expensive to rediscover, or too operational to leave implicit in prompts. Instead of rewriting the same context for each task, the repository packages that context into focused skills with lean instructions, references, and templates.

## Why this repository exists

- Standardize how PocketBase and Pockethost tasks are handled.
- Preserve runtime-specific knowledge such as PocketBase JavaScript and Goja constraints.
- Provide copyable deployment templates for GitHub Actions and Pockethost FTP workflows.
- Provide local tooling to download PocketBase binaries and validate migrations before deployment.
- Reduce prompt noise by moving stable operational knowledge into reusable skill folders.

## Current skills

### `pocketbase-pockethost`

Use this skill for PocketBase and Pockethost application work, especially:

- PocketBase hooks and migrations
- custom routes and auth flows
- collection design and validation rules
- debugging JavaScript executed by the embedded Goja runtime
- browser-level validation with Playwright and `$playwright-cli`

This skill includes a reference about PocketBase JavaScript behavior under Goja.

### `pockethost-deployment`

Use this skill for CI/CD setup and deployment workflows targeting Pockethost, especially:

- GitHub Actions FTP deployment
- branch-based staging and production environments
- Makefile-driven `lint`, `test`, `build`, and optional `health` checks
- previous-commit rollback guidance after failed post-deploy health checks

This skill includes a ready-to-copy GitHub Actions workflow template.

### `pocketbase-ci-cd`

Use this skill for local CI/CD-oriented PocketBase tooling, especially:

- downloading the right PocketBase binary for the current platform
- validating migrations locally before deploying to Pockethost
- reproducing migration execution outside the hosted environment
- building repeatable local checks around PocketBase releases

This skill includes a Python downloader with checksum verification and a reference for local migration testing.

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
