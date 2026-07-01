#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { importOpenGraphImage } = require("../server/api/_og-image-import");

const PAGE_SIZE = 500;

function loadEnvFile(filePath) {
  if (!filePath || !existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    envFile: ".env.local",
    limit: Infinity,
    strict: false,
  };

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--strict") {
      args.strict = true;
    } else if (arg.startsWith("--env=")) {
      args.envFile = arg.slice("--env=".length);
    } else if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer.");
      }
      args.limit = limit;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function compactUrl(value) {
  return String(value || "").trim();
}

function preferredProjectUrl(project) {
  return projectUrls(project)[0] || "";
}

function projectUrls(project) {
  return [
    compactUrl(project.website_url),
    compactUrl(project.demo_url),
    compactUrl(project.github_url),
  ].filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index);
}

async function listProjectsMissingImages(supabase, limit) {
  const projects = [];
  for (let offset = 0; projects.length < limit; offset += PAGE_SIZE) {
    const to = offset + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("projects")
      .select("id, owner_id, name, slug, website_url, demo_url, github_url, image_url, created_at")
      .or("image_url.is.null,image_url.eq.")
      .order("created_at", { ascending: true })
      .range(offset, to);

    if (error) throw error;

    const page = (data || []).filter((project) => preferredProjectUrl(project));
    projects.push(...page);
    if (!data || data.length < PAGE_SIZE) break;
  }

  return projects.slice(0, limit);
}

async function backfillProject(supabase, project, dryRun) {
  const urls = projectUrls(project);
  if (urls.length === 0) return { status: "skipped", reason: "no URL" };

  if (dryRun) {
    return { status: "pending", pageUrl: urls[0] };
  }

  let result;
  let lastError;
  for (const pageUrl of urls) {
    try {
      result = await importOpenGraphImage({
        pageUrl,
        userId: project.owner_id,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!result) throw lastError || new Error("Could not import Open Graph image.");

  const { data, error } = await supabase
    .from("projects")
    .update({ image_url: result.imageUrl })
    .eq("id", project.id)
    .or("image_url.is.null,image_url.eq.")
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    return { status: "skipped", reason: "image already set" };
  }

  return { status: "updated", imageUrl: result.imageUrl };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(path.resolve(process.cwd(), args.envFile));

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const projects = await listProjectsMissingImages(supabase, args.limit);
  console.log(
    `${args.dryRun ? "Found" : "Backfilling"} ${projects.length} project(s) missing images.`,
  );

  const summary = { updated: 0, skipped: 0, failed: 0 };
  for (const project of projects) {
    try {
      const result = await backfillProject(supabase, project, args.dryRun);
      if (result.status === "updated") summary.updated += 1;
      else if (result.status === "skipped") summary.skipped += 1;

      console.log(
        `[${result.status}] ${project.name || project.slug || project.id}`,
      );
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[failed] ${project.name || project.slug || project.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  console.log(
    `Done. updated=${summary.updated} skipped=${summary.skipped} failed=${summary.failed}`,
  );

  if (args.strict && summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
