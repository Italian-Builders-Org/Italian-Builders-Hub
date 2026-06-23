// One-off fix for contextual images that resolved to logos, modern stock photos,
// portraits, or otherwise off-topic pictures. Each entry overwrites an EXACT
// existing filename (so src paths in pioneersMedia.ts stay valid) using either a
// Wikipedia article lead image or a specific Commons file. Candidates are tried
// in order until one downloads.
//
// Run: node scripts/fix-pioneer-images.mjs

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "images", "pioneers");

const UA =
  "ItalianBuildersHub/1.0 (https://italianbuilders.co; contact info@italianbuilders.co)";

// target filename -> ordered candidate sources
const FIXES = [
  { file: "maria-montessori-g1.png", sources: [{ commons: "File:NSRW The Montessori Devices - children using.jpg" }] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, init, label) {
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await sleep(1500 * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${res.status} for ${label}`);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function articleImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
  const res = await fetchRetry(
    url,
    { headers: { "User-Agent": UA, accept: "application/json" } },
    `summary "${title}"`,
  );
  if (!res.ok) throw new Error(`summary ${res.status} for "${title}"`);
  const json = await res.json();
  const src = json.originalimage?.source || json.thumbnail?.source;
  if (!src) throw new Error(`no image for "${title}"`);
  return src;
}

async function commonsImage(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    fileTitle,
  )}&prop=imageinfo&iiprop=url&format=json&origin=*`;
  const res = await fetchRetry(
    url,
    { headers: { "User-Agent": UA, accept: "application/json" } },
    `commons "${fileTitle}"`,
  );
  if (!res.ok) throw new Error(`commons ${res.status} for "${fileTitle}"`);
  const json = await res.json();
  const pages = json.query?.pages || {};
  const page = Object.values(pages)[0];
  const src = page?.imageinfo?.[0]?.url;
  if (!src) throw new Error(`no commons image for "${fileTitle}"`);
  return src;
}

async function resolve(source) {
  if (source.article) return { src: await articleImage(source.article), label: `article ${source.article}` };
  if (source.commons) return { src: await commonsImage(source.commons), label: `commons ${source.commons}` };
  throw new Error("unknown source");
}

async function main() {
  for (const fix of FIXES) {
    let done = false;
    for (const source of fix.sources) {
      try {
        const { src, label } = await resolve(source);
        const res = await fetchRetry(src, { headers: { "User-Agent": UA } }, src);
        if (!res.ok) throw new Error(`download ${res.status} for ${src}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(join(OUT_DIR, fix.file), buf);
        console.log(`OK   ${fix.file} <- ${label}`);
        done = true;
        await sleep(500);
        break;
      } catch (err) {
        console.log(`FAIL ${fix.file} <- ${JSON.stringify(source)}: ${err.message}`);
      }
    }
    if (!done) console.log(`MISS ${fix.file} (all candidates failed)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
