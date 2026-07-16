import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_HOBBY_FUNCTIONS = 12;
const FUNCTION_EXTENSIONS = new Set([
  ".cjs",
  ".go",
  ".js",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".ts",
  ".tsx",
]);

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const apiRoot = path.join(repoRoot, "api");

async function listFunctionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFunctionFiles(absolutePath)));
      continue;
    }

    if (
      entry.isFile() &&
      !entry.name.endsWith(".d.ts") &&
      FUNCTION_EXTENSIONS.has(path.extname(entry.name))
    ) {
      files.push(path.relative(repoRoot, absolutePath));
    }
  }

  return files;
}

const functionFiles = (await listFunctionFiles(apiRoot)).sort();

if (functionFiles.length > MAX_HOBBY_FUNCTIONS) {
  console.error(
    `Vercel Hobby supports at most ${MAX_HOBBY_FUNCTIONS} serverless functions, but api/ contains ${functionFiles.length}:`,
  );
  for (const file of functionFiles) console.error(`- ${file}`);
  console.error(
    "Route the new public URL to an existing API entrypoint with a rewrite instead of adding another file under api/.",
  );
  process.exitCode = 1;
} else {
  console.log(
    `Vercel API function count: ${functionFiles.length}/${MAX_HOBBY_FUNCTIONS}.`,
  );
}
