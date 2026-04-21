# Local PocketBase Migrations

Use this reference when you need to validate PocketBase migrations locally before deploying to Pockethost.

## Why Use a Local Binary

Local migration execution helps catch problems earlier:

- migration syntax errors
- missing imports or invalid migration registration
- schema transitions that fail before deployment
- version-specific behavior changes in PocketBase

This workflow is for local validation. It does not execute migrations on Pockethost directly.

## Download the Binary

Use the bundled downloader:

```bash
python3 pocketbase/scripts/download_pocketbase.py
```

By default it:

- detects the current operating system and CPU architecture
- resolves the latest stable PocketBase release
- downloads the matching zip archive
- verifies the archive checksum using the official `checksums.txt`
- extracts the PocketBase binary into `./.cache/pocketbase/<version>/<platform>/`

To pin a version:

```bash
python3 pocketbase/scripts/download_pocketbase.py --version 0.37.1
```

To choose a different output directory:

```bash
python3 pocketbase/scripts/download_pocketbase.py --output-dir ./.tools/pocketbase
```

## Run Migrations Locally

Use the downloaded binary in a disposable local workspace rather than against production data.

Example:

```bash
PB_BIN="$(python3 pocketbase/scripts/download_pocketbase.py --version 0.37.1 | tail -n 1)"
mkdir -p .tmp/pb-test
"$PB_BIN" migrate up --dir ./.tmp/pb-test/pb_data --migrationsDir ./pb_migrations
```

Revert the last migration:

```bash
"$PB_BIN" migrate down 1 --dir ./.tmp/pb-test/pb_data --migrationsDir ./pb_migrations
```

Sync migration history:

```bash
"$PB_BIN" migrate history-sync --dir ./.tmp/pb-test/pb_data --migrationsDir ./pb_migrations
```

## Recommended Local Workflow

1. Checkout the branch you want to validate.
2. Download the PocketBase version you want to test.
3. Run migrations in a disposable local environment with explicit `--dir` and `--migrationsDir` values.
4. If needed, revert with `migrate down 1` and rerun.
5. Only then proceed to deployment or CI changes.

## Notes

- Defaulting to the latest PocketBase release is convenient for quick validation.
- Pin a specific version when reproducing a production issue or validating a release upgrade.
- Keep the binary download step and the hosted deployment step separate. Use `$pockethost` for the GitHub Actions and FTP side.
