// One-off helper: downloads portrait + work images for the Pioneers page
// from Wikipedia (REST summary API) into public/images/pioneers/.
// Run: node scripts/fetch-pioneers-images.mjs

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "images", "pioneers");

const UA =
  "ItalianBuildersHub/1.0 (https://italianbuilders.co; contact info@italianbuilders.co)";

// slug -> wikipedia article titles. `work` is the iconic invention/creation.
const FIGURES = [
  { slug: "leonardo-da-vinci", portrait: "Leonardo da Vinci", work: "Vitruvian Man" },
  { slug: "michelangelo", portrait: "Michelangelo", work: "David (Michelangelo)" },
  { slug: "galileo-galilei", portrait: "Galileo Galilei", work: "Galileo's Leaning Tower of Pisa experiment" },
  { slug: "alessandro-volta", portrait: "Alessandro Volta", work: "Voltaic pile" },
  { slug: "guglielmo-marconi", portrait: "Guglielmo Marconi", work: "Wireless telegraphy" },
  { slug: "enrico-fermi", portrait: "Enrico Fermi", work: "Chicago Pile-1" },
  { slug: "antonio-meucci", portrait: "Antonio Meucci", work: "Telephone" },
  { slug: "federico-faggin", portrait: "Federico Faggin", work: "Intel 4004" },
  { slug: "adriano-olivetti", portrait: "Adriano Olivetti", work: "Programma 101" },
  { slug: "fibonacci", portrait: "Fibonacci", work: "Fibonacci sequence" },
  { slug: "maria-montessori", portrait: "Maria Montessori", work: "Montessori education" },
  { slug: "rita-levi-montalcini", portrait: "Rita Levi-Montalcini", work: "Nerve growth factor" },
  { slug: "giulio-natta", portrait: "Giulio Natta", work: "Polypropylene" },
  { slug: "camillo-golgi", portrait: "Camillo Golgi", work: "Golgi apparatus" },
  { slug: "filippo-brunelleschi", portrait: "Filippo Brunelleschi", work: "Florence Cathedral" },
  { slug: "andrea-palladio", portrait: "Andrea Palladio", work: "Villa La Rotonda" },
  { slug: "evangelista-torricelli", portrait: "Evangelista Torricelli", work: "Barometer" },
  { slug: "luigi-galvani", portrait: "Luigi Galvani", work: "Galvanism" },
  { slug: "enzo-ferrari", portrait: "Enzo Ferrari", work: "Ferrari 250 GTO" },
  { slug: "carlo-rubbia", portrait: "Carlo Rubbia", work: "W and Z bosons" },
  { slug: "renzo-piano", portrait: "Renzo Piano", work: "The Shard" },
  { slug: "giuseppe-peano", portrait: "Giuseppe Peano", work: "Peano curve" },
  // --- Additions: ancient + more eras ---
  { slug: "lucretius", portrait: "Lucretius", work: "De rerum natura" },
  { slug: "vitruvius", portrait: "Vitruvius", work: "De architectura" },
  { slug: "pliny-the-elder", portrait: "Pliny the Elder", work: "Natural History (Pliny)" },
  { slug: "frontinus", portrait: "Frontinus", work: "Roman aqueduct" },
  { slug: "guido-of-arezzo", portrait: "Guido of Arezzo", work: "Guidonian hand" },
  { slug: "marco-polo", portrait: "Marco Polo", work: "The Travels of Marco Polo" },
  { slug: "donatello", portrait: "Donatello", work: "Equestrian Statue of Gattamelata" },
  { slug: "luca-pacioli", portrait: "Luca Pacioli", work: "Summa de arithmetica" },
  { slug: "christopher-columbus", portrait: "Christopher Columbus", work: "Voyages of Christopher Columbus" },
  { slug: "amerigo-vespucci", portrait: "Amerigo Vespucci", work: "Naming of the Americas" },
  { slug: "raphael", portrait: "Raphael", work: "The School of Athens" },
  { slug: "gerolamo-cardano", portrait: "Gerolamo Cardano", work: "Gimbal" },
  { slug: "caravaggio", portrait: "Caravaggio", work: "The Calling of Saint Matthew" },
  { slug: "gian-lorenzo-bernini", portrait: "Gian Lorenzo Bernini", work: "Ecstasy of Saint Teresa" },
  { slug: "giovanni-domenico-cassini", portrait: "Giovanni Domenico Cassini", work: "Cassini Division" },
  { slug: "marcello-malpighi", portrait: "Marcello Malpighi", work: "Capillary" },
  { slug: "antonio-stradivari", portrait: "Antonio Stradivari", work: "Stradivarius" },
  { slug: "antonio-vivaldi", portrait: "Antonio Vivaldi", work: "The Four Seasons (Vivaldi)" },
  { slug: "joseph-louis-lagrange", portrait: "Joseph-Louis Lagrange", work: "Lagrangian mechanics" },
  { slug: "amedeo-avogadro", portrait: "Amedeo Avogadro", work: "Avogadro constant" },
  { slug: "giuseppe-verdi", portrait: "Giuseppe Verdi", work: "La traviata" },
  { slug: "galileo-ferraris", portrait: "Galileo Ferraris", work: "Induction motor" },
  { slug: "tullio-levi-civita", portrait: "Tullio Levi-Civita", work: "Levi-Civita symbol" },
  { slug: "corradino-dascanio", portrait: "Corradino D'Ascanio", work: "Vespa" },
  { slug: "margherita-hack", portrait: "Margherita Hack", work: "Stellar classification" },
  { slug: "giorgio-parisi", portrait: "Giorgio Parisi", work: "Spin glass" },
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

async function summaryImage(title) {
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

function extFromUrl(u) {
  const m = u.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  const ext = (m?.[1] || "jpg").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

async function download(u, basePath, existing) {
  const ext = extFromUrl(u);
  const rel0 = `${basePath}.${ext}`;
  if (existing.has(rel0)) return `/images/pioneers/${rel0}`;
  const res = await fetchRetry(u, { headers: { "User-Agent": UA } }, u);
  if (!res.ok) throw new Error(`download ${res.status} for ${u}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const rel = `${basePath}.${ext}`;
  await writeFile(join(OUT_DIR, rel), buf);
  return `/images/pioneers/${rel}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const existing = new Set(await readdir(OUT_DIR).catch(() => []));
  const manifest = {};

  const findExisting = (base) => {
    const hit = [...existing].find((f) => f.replace(/\.[^.]+$/, "") === base);
    return hit ? `/images/pioneers/${hit}` : null;
  };

  for (const fig of FIGURES) {
    manifest[fig.slug] = {};
    let didNetwork = false;

    const havePortrait = findExisting(fig.slug);
    if (havePortrait) {
      manifest[fig.slug].portrait = havePortrait;
      console.log(`portrait skip ${fig.slug}`);
    } else {
      try {
        const src = await summaryImage(fig.portrait);
        manifest[fig.slug].portrait = await download(src, fig.slug, existing);
        didNetwork = true;
        console.log(`portrait ok   ${fig.slug}`);
      } catch (err) {
        console.log(`portrait FAIL ${fig.slug}: ${err.message}`);
      }
    }

    if (fig.work) {
      const haveWork = findExisting(`${fig.slug}-work`);
      if (haveWork) {
        manifest[fig.slug].work = haveWork;
        console.log(`work skip     ${fig.slug}`);
      } else {
        try {
          const src = await summaryImage(fig.work);
          manifest[fig.slug].work = await download(src, `${fig.slug}-work`, existing);
          didNetwork = true;
          console.log(`work ok       ${fig.slug}`);
        } catch (err) {
          console.log(`work FAIL     ${fig.slug}: ${err.message}`);
        }
      }
    }

    if (didNetwork) await sleep(600);
  }

  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nmanifest written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
