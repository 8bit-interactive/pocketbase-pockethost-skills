import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import extract from "extract-zip";
import { DEFAULT_POCKETBASE_VERSION, TOOL_DIR } from "./constants.js";
import { CommandError } from "./errors.js";
import { detectPlatform, ensureDir, fetchBuffer, fetchText, fileExists, parseChecksums, runCommand, sha256 } from "./utils.js";

export function resolvePocketBaseBinaryPath(projectRoot, version) {
  const { assetPlatform, binaryName } = detectPlatform();
  return path.join(projectRoot, TOOL_DIR, "pocketbase", version || DEFAULT_POCKETBASE_VERSION, assetPlatform, binaryName);
}

export async function ensurePocketBaseInstalled(projectRoot, version) {
  const resolvedVersion = version || DEFAULT_POCKETBASE_VERSION;
  const binaryPath = resolvePocketBaseBinaryPath(projectRoot, resolvedVersion);

  if (await fileExists(binaryPath)) {
    return binaryPath;
  }

  const { assetPlatform, binaryName } = detectPlatform();
  const assetName = `pocketbase_${resolvedVersion}_${assetPlatform}.zip`;
  const downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${resolvedVersion}/${assetName}`;
  const checksumsUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${resolvedVersion}/checksums.txt`;
  const cacheDir = path.join(projectRoot, TOOL_DIR, "downloads", resolvedVersion, assetPlatform);
  const archivePath = path.join(cacheDir, assetName);
  const extractDir = path.dirname(binaryPath);

  console.log(`Downloading PocketBase ${resolvedVersion} for ${assetPlatform}...`);
  await ensureDir(cacheDir);

  const [archiveBuffer, checksumsText] = await Promise.all([
    fetchBuffer(downloadUrl),
    fetchText(checksumsUrl)
  ]);

  const expectedChecksum = parseChecksums(checksumsText, assetName);
  const actualChecksum = sha256(archiveBuffer);

  if (expectedChecksum !== actualChecksum) {
    throw new CommandError(`Checksum mismatch for ${assetName}`);
  }

  await fs.writeFile(archivePath, archiveBuffer);
  await ensureDir(extractDir);
  await extract(archivePath, { dir: extractDir });
  await fs.chmod(binaryPath, 0o755);

  return binaryPath;
}

export async function runPocketBase(projectRoot, version, args) {
  const binaryPath = await ensurePocketBaseInstalled(projectRoot, version);
  await runCommand(binaryPath, args, {
    cwd: projectRoot,
    env: process.env
  });
}

export async function runPocketBaseMigrate(projectRoot, version, dataDir) {
  const args = [
    "migrate",
    "up",
    "--dev",
    "--dir",
    dataDir,
    "--hooksDir",
    path.join(projectRoot, "pb_hooks"),
    "--migrationsDir",
    path.join(projectRoot, "pb_migrations"),
    "--publicDir",
    path.join(projectRoot, "pb_public")
  ];

  await runPocketBase(projectRoot, version, args);
}

export function defaultDevArgs(projectRoot, httpAddress = "127.0.0.1:8090") {
  return [
    "serve",
    "--dev",
    "--http",
    httpAddress,
    "--dir",
    path.join(projectRoot, "pb_data"),
    "--hooksDir",
    path.join(projectRoot, "pb_hooks"),
    "--migrationsDir",
    path.join(projectRoot, "pb_migrations"),
    "--publicDir",
    path.join(projectRoot, "pb_public")
  ];
}

