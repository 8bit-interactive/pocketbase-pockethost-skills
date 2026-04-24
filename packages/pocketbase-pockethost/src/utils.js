import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { CommandError } from "./errors.js";

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "pocketbase-site";
}

export async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function readJson(targetPath) {
  const raw = await fs.readFile(targetPath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(targetPath, value) {
  await fs.writeFile(targetPath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export async function readText(targetPath) {
  return fs.readFile(targetPath, "utf8");
}

export async function writeText(targetPath, value) {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, value, "utf8");
}

export function detectPlatform() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === "darwin" && (arch === "arm64" || arch === "aarch64")) {
    return { assetPlatform: "darwin_arm64", binaryName: "pocketbase" };
  }

  if (platform === "darwin" && (arch === "x64" || arch === "amd64")) {
    return { assetPlatform: "darwin_amd64", binaryName: "pocketbase" };
  }

  if (platform === "linux" && (arch === "x64" || arch === "amd64")) {
    return { assetPlatform: "linux_amd64", binaryName: "pocketbase" };
  }

  if (platform === "linux" && (arch === "arm64" || arch === "aarch64")) {
    return { assetPlatform: "linux_arm64", binaryName: "pocketbase" };
  }

  if (platform === "win32" && (arch === "x64" || arch === "amd64")) {
    return { assetPlatform: "windows_amd64", binaryName: "pocketbase.exe" };
  }

  throw new CommandError(`Unsupported platform for PocketBase: ${platform}/${arch}`);
}

export async function fetchBuffer(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "pocketbase-pockethost"
      }
    });

    if (!response.ok) {
      throw new CommandError(`Request failed for ${url}: ${response.status} ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    const curlPath = await resolveCurlPath();
    if (!curlPath) {
      throw error;
    }

    return runCommandCapture(curlPath, ["-fsSL", "-A", "pocketbase-pockethost", url]);
  }
}

export async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "pocketbase-pockethost"
      }
    });

    if (!response.ok) {
      throw new CommandError(`Request failed for ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    const curlPath = await resolveCurlPath();
    if (!curlPath) {
      throw error;
    }

    const buffer = await runCommandCapture(curlPath, ["-fsSL", "-A", "pocketbase-pockethost", url]);
    return buffer.toString("utf8");
  }
}

export function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function parseChecksums(checksumText, assetName) {
  for (const line of checksumText.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const currentName = parts[parts.length - 1].replace(/^\*/, "");
      const currentChecksum = parts[0].split(":").pop().toLowerCase();

      if (currentName === assetName) {
        return currentChecksum;
      }
    }
  }

  throw new CommandError(`Could not find checksum for ${assetName}`);
}

export async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      if (signal) {
        reject(new CommandError(`${command} terminated with signal ${signal}`));
        return;
      }

      reject(new CommandError(`${command} exited with code ${code}`));
    });
  });
}

export async function runCommandCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });

    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => {
      stdout.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr.push(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }

      if (signal) {
        reject(new CommandError(`${command} terminated with signal ${signal}`));
        return;
      }

      const stderrText = Buffer.concat(stderr).toString("utf8").trim();
      reject(new CommandError(stderrText || `${command} exited with code ${code}`));
    });
  });
}

async function resolveCurlPath() {
  const candidates = ["/usr/bin/curl", "/opt/homebrew/bin/curl", "curl"];

  for (const candidate of candidates) {
    try {
      if (candidate.includes("/")) {
        await fs.access(candidate);
        return candidate;
      }

      return candidate;
    } catch {
      // ignore
    }
  }

  return null;
}

export async function copyDirectory(sourceDir, targetDir, replacements = {}) {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, replacements);
      continue;
    }

    let content = await fs.readFile(sourcePath);

    const isText =
      entry.name.endsWith(".json") ||
      entry.name.endsWith(".md") ||
      entry.name.endsWith(".html") ||
      entry.name.endsWith(".css") ||
      entry.name.endsWith(".js") ||
      entry.name === ".gitignore" ||
      entry.name.startsWith(".");

    if (isText) {
      let text = content.toString("utf8");

      for (const [key, value] of Object.entries(replacements)) {
        text = text.replaceAll(key, value);
      }

      content = Buffer.from(text, "utf8");
    }

    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content);
  }
}

export async function listVisibleEntries(dirPath) {
  const entries = await fs.readdir(dirPath);
  return entries.filter((entry) => entry !== ".git" && entry !== ".DS_Store");
}

export async function emptyDirectory(dirPath) {
  const entries = await listVisibleEntries(dirPath);
  return entries.length === 0;
}

export function timestampForMigration(date = new Date()) {
  const iso = date.toISOString().replace(/[-:TZ.]/g, "");
  return iso.slice(0, 14);
}

export function parseHeadingFromHtml(html) {
  const match = html.match(/<h1>(.*?)<\/h1>/is);
  return match ? match[1].trim() : "";
}
