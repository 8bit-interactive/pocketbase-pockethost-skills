---
name: pocketbase-ci-cd
description: Use when setting up or running local CI-style workflows for PocketBase, especially downloading the correct PocketBase binary for the current platform, validating migrations locally, and reducing deployment risk before shipping to Pockethost.
---

# PocketBase CI CD

## Overview

Use this skill for local PocketBase validation workflows that should happen before or alongside deployment work.

Prefer a real PocketBase binary for the current platform over mocked migration execution or undocumented local wrappers.

## Workflow

1. Read [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md).
2. Run [scripts/download_pocketbase.py](scripts/download_pocketbase.py) to fetch the correct PocketBase binary for the current platform.
3. Use the downloaded binary to run `migrate up`, `migrate down`, or `migrate history-sync` in a disposable local workspace.
4. Keep local migration validation separate from hosted Pockethost deployment logic.

## Defaults

- Download the latest stable PocketBase release by default.
- Verify the official release checksum before extracting the archive.
- Allow pinning a specific PocketBase version when reproducibility matters.
- Treat the downloader as preparation tooling, not as a migration runner by itself.

## References

- [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md): Local workflow for downloading PocketBase and validating migrations.
- [scripts/download_pocketbase.py](scripts/download_pocketbase.py): Python helper that resolves the current platform, downloads the official archive, verifies the checksum, and extracts the binary.
