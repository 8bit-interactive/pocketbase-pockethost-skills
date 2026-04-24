import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "basic-ftp";
import { CommandError } from "./errors.js";
import { detectProjectSurface, resolveEnvironmentName, resolveHealthcheckBaseUrl, resolveTenantId } from "./project.js";

async function deployDirectory(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.uploadFromDir(localDir, remoteDir);
}

export async function runHealthcheck(project, environmentName) {
  const tenantId = resolveTenantId(project, environmentName);
  const baseUrl = resolveHealthcheckBaseUrl(project, environmentName, tenantId);
  const indexHtml = await fs.readFile(path.join(project.projectRoot, "pb_public", "index.html"), "utf8");
  const expectedHeadingMatch = indexHtml.match(/<h1>(.*?)<\/h1>/is);
  const expectedHeading = expectedHeadingMatch ? expectedHeadingMatch[1].trim() : "";

  if (!baseUrl) {
    throw new CommandError(`Missing healthcheck base URL for environment '${environmentName}'. Set HEALTHCHECK_BASE_URL or POCKETHOST_TENANT_ID.`);
  }

  if (!expectedHeading) {
    throw new CommandError("Could not extract an <h1> marker from pb_public/index.html.");
  }

  const response = await fetch(baseUrl, {
    headers: {
      "User-Agent": "pocketbase-pockethost"
    }
  });

  if (!response.ok) {
    throw new CommandError(`Healthcheck failed for ${baseUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  if (!html.includes(expectedHeading)) {
    throw new CommandError(`Healthcheck failed for ${baseUrl}: expected page marker '${expectedHeading}' was not found.`);
  }
}

export async function deployProject(project, options = {}) {
  const environmentName = await resolveEnvironmentName(project, options);
  const tenantId = resolveTenantId(project, environmentName);
  const ftpUsername = process.env.POCKETHOST_FTP_USERNAME || "";
  const ftpPassword = process.env.POCKETHOST_FTP_PASSWORD || "";
  const ftpHost = process.env.POCKETHOST_FTP_HOST || "ftp.pockethost.io";
  const dryRun = options.dryRun === true;
  const surface = await detectProjectSurface(project.projectRoot);

  if (!ftpUsername) {
    throw new CommandError(`Missing POCKETHOST_FTP_USERNAME for environment '${environmentName}'.`);
  }

  if (!ftpPassword) {
    throw new CommandError(`Missing POCKETHOST_FTP_PASSWORD for environment '${environmentName}'.`);
  }

  if ((surface.pbHooks || surface.pbMigrations) && !tenantId) {
    throw new CommandError(`Missing POCKETHOST_TENANT_ID for environment '${environmentName}'. Hooks and migrations require a tenant-scoped deploy path.`);
  }

  const publicDir = tenantId ? `${tenantId}/pb_public` : "pb_public";
  const hooksDir = tenantId ? `${tenantId}/pb_hooks` : "";
  const migrationsDir = tenantId ? `${tenantId}/pb_migrations` : "";

  if (dryRun) {
    return {
      environmentName,
      ftpHost,
      publicDir,
      hooksDir,
      migrationsDir,
      surface
    };
  }

  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: ftpHost,
      user: ftpUsername,
      password: ftpPassword,
      secure: false
    });

    if (surface.pbPublic) {
      console.log(`Uploading pb_public -> ${publicDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_public"), publicDir);
    }

    if (surface.pbHooks) {
      console.log(`Uploading pb_hooks -> ${hooksDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_hooks"), hooksDir);
    }

    if (surface.pbMigrations) {
      console.log(`Uploading pb_migrations -> ${migrationsDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_migrations"), migrationsDir);
    }
  } finally {
    client.close();
  }

  if (surface.pbPublic) {
    await runHealthcheck(project, environmentName);
  }

  return {
    environmentName,
    ftpHost,
    publicDir,
    hooksDir,
    migrationsDir,
    surface
  };
}
