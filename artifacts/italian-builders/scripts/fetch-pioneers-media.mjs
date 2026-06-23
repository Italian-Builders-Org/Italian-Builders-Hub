// Downloads several CONTEXTUAL images per pioneer from Wikipedia and writes a
// typed data file (src/data/pioneersMedia.ts) mapping slug -> ordered images
// with captions and a paragraph anchor (`after`). The dialog interleaves these
// images between the biography paragraphs, near the text they illustrate.
//
// Run: node scripts/fetch-pioneers-media.mjs
//
// Item kinds per slug:
//   { work: true, caption, after }   -> reuse the already-downloaded <slug>-work.* file
//   { title, caption, after }        -> download the lead image of a Wikipedia article
//   { commons, caption, after }      -> download a specific Wikimedia Commons file
//                                       (use when an article lead image is a logo)

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "images", "pioneers");
const DATA_FILE = join(__dirname, "..", "src", "data", "pioneersMedia.ts");

const UA =
  "ItalianBuildersHub/1.0 (https://italianbuilders.co; contact info@italianbuilders.co)";

// slug -> ordered contextual images. `after` is the 0-based paragraph index the
// image should appear after. Items are placed near the text they illustrate.
const EXTRA = {
  lucretius: [
    { work: true, caption: "De rerum natura, his epic poem on the nature of things.", after: 2 },
    { title: "Epicurus", caption: "Epicurus, the Greek philosopher whose teaching Lucretius followed.", after: 1 },
    { title: "Democritus", caption: "Democritus, an early Greek atomist whose ideas echo through the poem.", after: 3 },
  ],
  vitruvius: [
    { work: true, caption: "De architectura, the oldest surviving treatise on building.", after: 2 },
    { title: "Maison Carrée", caption: "The Maison Carrée, a Roman temple of the kind Vitruvius described.", after: 2 },
    { title: "Vitruvian Man", caption: "Leonardo's Vitruvian Man, drawn from Vitruvius' note on human proportion.", after: 4 },
  ],
  "pliny-the-elder": [
    { work: true, caption: "Naturalis Historia, his vast encyclopaedia of the natural world.", after: 2 },
    { title: "Eruption of Mount Vesuvius in 79 AD", caption: "The eruption of Vesuvius in 79 AD, which he sailed toward and did not survive.", after: 4 },
  ],
  frontinus: [
    { work: true, caption: "A Roman aqueduct, the engineering he documented and managed.", after: 2 },
    { title: "Pont du Gard", caption: "The Pont du Gard, a surviving Roman aqueduct bridge in Gaul.", after: 3 },
  ],
  "guido-of-arezzo": [
    { work: true, caption: "The Guidonian hand, his memory aid for singing the scale.", after: 3 },
    { title: "Gregorian chant", caption: "A chant manuscript with the staff notation his system made possible.", after: 2 },
  ],
  fibonacci: [
    { work: true, caption: "The Fibonacci sequence, where each number is the sum of the two before.", after: 3 },
    { title: "Liber Abaci", caption: "Liber Abaci, the book that brought Arabic numerals to Europe.", after: 2 },
    { title: "Golden ratio", caption: "The golden ratio, closely tied to the Fibonacci numbers.", after: 4 },
  ],
  "marco-polo": [
    { work: true, caption: "The Travels of Marco Polo, his account of the journey east.", after: 3 },
    { title: "Kublai Khan", caption: "Kublai Khan, the Mongol emperor at whose court Polo served.", after: 2 },
    { title: "Silk Road", caption: "The Silk Road, the trade routes he travelled to reach China.", after: 1 },
  ],
  "filippo-brunelleschi": [
    { work: true, caption: "The dome of Florence Cathedral, raised without external scaffolding.", after: 2 },
    { title: "Florence Baptistery", caption: "The Baptistery doors, whose competition launched his career.", after: 1 },
    { title: "Holy Trinity (Masaccio)", caption: "Masaccio's Holy Trinity, an early triumph of the linear perspective he devised.", after: 4 },
  ],
  donatello: [
    { work: true, caption: "The equestrian statue of Gattamelata, the first of its kind since antiquity.", after: 3 },
    { title: "Judith and Holofernes (Donatello)", caption: "Judith and Holofernes, his dramatic late bronze.", after: 2 },
  ],
  "luca-pacioli": [
    { work: true, caption: "Summa de arithmetica, his great compendium of mathematics.", after: 2 },
    { title: "Bookkeeping", caption: "Double-entry bookkeeping, the accounting method he codified.", after: 3 },
    { title: "Divina proportione", caption: "Divina proportione, illustrated by his friend Leonardo da Vinci.", after: 4 },
  ],
  "christopher-columbus": [
    { work: true, caption: "A map of the voyages that opened the Atlantic crossing.", after: 3 },
    { title: "Santa María (ship)", caption: "The Santa María, the flagship of his first voyage in 1492.", after: 2 },
  ],
  "leonardo-da-vinci": [
    { title: "Mona Lisa", caption: "The Mona Lisa, the most famous painting in the world.", after: 2 },
    { title: "The Last Supper (Leonardo)", caption: "The Last Supper, his mural in Milan.", after: 2 },
    { work: true, caption: "The Vitruvian Man, his study of human proportion.", after: 4 },
  ],
  "amerigo-vespucci": [
    { work: true, caption: "Vespucci realised the new lands were a separate continent.", after: 2 },
    { title: "Waldseemüller map", caption: "The 1507 Waldseemüller map, the first to label the land 'America'.", after: 4 },
  ],
  michelangelo: [
    { work: true, caption: "David, carved from a single flawed block of marble.", after: 2 },
    { title: "Sistine Chapel ceiling", caption: "The Sistine Chapel ceiling, painted over four years on his back.", after: 3 },
    { title: "Pietà (Michelangelo)", caption: "The Pietà, finished when he was just twenty-four.", after: 2 },
  ],
  raphael: [
    { work: true, caption: "The School of Athens, his fresco of the great ancient thinkers.", after: 3 },
    { title: "Sistine Madonna", caption: "The Sistine Madonna, among his most beloved works.", after: 2 },
  ],
  "gerolamo-cardano": [
    { work: true, caption: "The gimbal, a self-levelling suspension named after him.", after: 3 },
    { title: "Niccolò Fontana Tartaglia", caption: "Tartaglia, his rival in the famous duel over cubic equations.", after: 2 },
  ],
  "andrea-palladio": [
    { work: true, caption: "Villa La Rotonda, his perfectly symmetrical country house.", after: 2 },
    { title: "I quattro libri dell'architettura", caption: "The Four Books of Architecture, his enduring treatise.", after: 3 },
    { title: "Monticello", caption: "Jefferson's Monticello, one of countless buildings he inspired.", after: 5 },
  ],
  "galileo-galilei": [
    { work: true, caption: "His study of falling bodies and motion.", after: 2 },
    { title: "Galilean moons", caption: "The four moons of Jupiter he discovered through his telescope.", after: 3 },
    { title: "Phases of Venus", caption: "The phases of Venus, proof that it orbits the Sun.", after: 3 },
    { title: "Galileo affair", caption: "Galileo before the Inquisition, tried for defending Copernicus.", after: 5 },
  ],
  caravaggio: [
    { work: true, caption: "The Calling of Saint Matthew, lit by his dramatic shafts of light.", after: 3 },
    { title: "Bacchus (Caravaggio)", caption: "Bacchus, from his early years in Rome.", after: 2 },
    { title: "Judith Beheading Holofernes (Caravaggio)", caption: "Judith Beheading Holofernes, raw and violent realism.", after: 3 },
  ],
  "gian-lorenzo-bernini": [
    { work: true, caption: "The Ecstasy of Saint Teresa, marble turned to soft flesh and cloth.", after: 3 },
    { title: "Apollo and Daphne (Bernini)", caption: "Apollo and Daphne, sculpted when he was in his twenties.", after: 2 },
    { title: "St. Peter's Square", caption: "St. Peter's Square, embraced by his sweeping colonnade.", after: 4 },
  ],
  "evangelista-torricelli": [
    { work: true, caption: "The barometer, his instrument for measuring air pressure.", after: 3 },
    { title: "Galileo Galilei", caption: "Galileo, whose assistant Torricelli became at the end of his life.", after: 1 },
  ],
  "giovanni-domenico-cassini": [
    { work: true, caption: "Saturn and its rings, which he studied in detail.", after: 2 },
    { title: "Cassini Division", caption: "The Cassini Division, the gap in Saturn's rings he discovered.", after: 3 },
    { title: "Cassini–Huygens", caption: "The Cassini spacecraft, named in his honour centuries later.", after: 5 },
  ],
  "marcello-malpighi": [
    { work: true, caption: "Capillaries, the tiny vessels he was first to observe.", after: 3 },
    { commons: "File:Hooke-microscope.png", caption: "A 17th-century compound microscope, the kind of instrument that revealed his capillaries.", after: 1 },
  ],
  "antonio-stradivari": [
    { work: true, caption: "A Stradivarius violin, still unmatched after three centuries.", after: 2 },
    { title: "Messiah Stradivarius", caption: "The 'Messiah', one of his most celebrated surviving instruments.", after: 3 },
  ],
  "antonio-vivaldi": [
    { work: true, caption: "The published score of his Op. 8, the 1725 set that opens with The Four Seasons.", after: 3 },
    { title: "Ospedale della Pietà", caption: "The Pietà in Venice, the orphanage where he taught and composed.", after: 2 },
  ],
  "joseph-louis-lagrange": [
    { work: true, caption: "Mécanique analytique, his sweeping reformulation of mechanics.", after: 3 },
    { title: "Lagrangian point", caption: "Lagrange points, the gravitational sweet spots he predicted.", after: 4 },
  ],
  "luigi-galvani": [
    { work: true, caption: "His experiments making frog legs twitch with electricity.", after: 3 },
    { title: "Alessandro Volta", caption: "Alessandro Volta, whose challenge to Galvani led to the battery.", after: 4 },
  ],
  "alessandro-volta": [
    { work: true, caption: "The voltaic pile, the first true electric battery.", after: 3 },
    { title: "Electric battery", caption: "The battery, the descendant of his pile that powers the modern world.", after: 4 },
  ],
  "amedeo-avogadro": [
    { work: true, caption: "Avogadro's law on the volume of gases.", after: 3 },
    { title: "Stanislao Cannizzaro", caption: "Cannizzaro, who revived Avogadro's idea after his death.", after: 4 },
  ],
  "antonio-meucci": [
    { work: true, caption: "An early telephone apparatus of the kind he built.", after: 3 },
    { title: "Alexander Graham Bell", caption: "Bell, who patented the telephone amid lasting dispute over priority.", after: 4 },
  ],
  "giuseppe-verdi": [
    { work: true, caption: "La traviata, among the most performed operas in the world.", after: 3 },
    { title: "Nabucco", caption: "Nabucco, the opera that made him a national figure.", after: 1 },
    { title: "Aida", caption: "Aida, his grand opera set in ancient Egypt.", after: 2 },
  ],
  "camillo-golgi": [
    { work: true, caption: "The Golgi apparatus, the cell structure that bears his name.", after: 3 },
    { title: "Neuron", caption: "The neuron, revealed by his black-staining method.", after: 2 },
    { title: "Santiago Ramón y Cajal", caption: "Ramón y Cajal, who shared the Nobel Prize with him.", after: 3 },
  ],
  "galileo-ferraris": [
    { work: true, caption: "The induction motor, driven by a rotating magnetic field.", after: 2 },
    { title: "Alternating current", caption: "Alternating current, the system his work helped make practical.", after: 4 },
  ],
  "giuseppe-peano": [
    { work: true, caption: "The Peano curve, a line that fills an entire square.", after: 3 },
    { title: "Hilbert curve", caption: "The Hilbert curve, another space-filling curve in his tradition.", after: 4 },
  ],
  "maria-montessori": [
    { work: true, caption: "Montessori learning materials, designed for self-directed discovery.", after: 3 },
    { commons: "File:NSRW The Montessori Devices - children using.jpg", caption: "Children using her teaching devices, the hands-on method she pioneered.", after: 1 },
  ],
  "tullio-levi-civita": [
    { work: true, caption: "The mathematics of curved space that he helped build.", after: 2 },
    { title: "Albert Einstein", caption: "Einstein, who relied on Levi-Civita's calculus for general relativity.", after: 3 },
    { title: "General relativity", caption: "General relativity, the theory his tensor calculus made possible.", after: 4 },
  ],
  "guglielmo-marconi": [
    { work: true, caption: "His wireless telegraphy equipment.", after: 2 },
    { title: "RMS Titanic", caption: "The Titanic, whose survivors were rescued thanks to his wireless.", after: 4 },
  ],
  "corradino-dascanio": [
    { work: true, caption: "The Vespa, the scooter he designed for postwar Italy.", after: 3 },
    { title: "Roman Holiday", caption: "Roman Holiday, the film that made the Vespa a global icon.", after: 5 },
  ],
  "enzo-ferrari": [
    { work: true, caption: "The Ferrari 250 GTO, one of the most coveted cars ever made.", after: 3 },
    { title: "Ferrari 312T", caption: "A Ferrari Formula One car, the racing that was always his true obsession.", after: 2 },
  ],
  "adriano-olivetti": [
    { work: true, caption: "The Programma 101, an early desktop computer.", after: 3 },
    { title: "Olivetti Lettera 22", caption: "The Lettera 22, a portable typewriter celebrated for its design.", after: 4 },
  ],
  "enrico-fermi": [
    { work: true, caption: "Chicago Pile-1, the first controlled nuclear chain reaction.", after: 3 },
    { title: "Nuclear chain reaction", caption: "The nuclear chain reaction he first sustained and controlled.", after: 4 },
  ],
  "giulio-natta": [
    { work: true, caption: "The structure of polypropylene, the plastic he helped create.", after: 3 },
    { title: "Plastic", caption: "Everyday plastic objects, made possible by the polymers he learned to control.", after: 4 },
  ],
  "rita-levi-montalcini": [
    { work: true, caption: "Nerve growth factor, the discovery that won her the Nobel Prize.", after: 3 },
    { title: "Neuron", caption: "The neuron, whose growth her factor controls.", after: 4 },
  ],
  "margherita-hack": [
    { work: true, caption: "Stellar classification, central to her study of the stars.", after: 2 },
    { title: "Astronomical spectroscopy", caption: "A large telescope, the kind of instrument she used to study the stars.", after: 3 },
  ],
  "carlo-rubbia": [
    { work: true, caption: "The discovery of the W and Z bosons.", after: 3 },
    { title: "Super Proton Synchrotron", caption: "The Super Proton Synchrotron at CERN, where his team found the W and Z bosons.", after: 1 },
    { title: "Standard Model", caption: "The Standard Model, confirmed by the particles he found.", after: 4 },
  ],
  "renzo-piano": [
    { work: true, caption: "The Shard in London, one of his landmark towers.", after: 3 },
    { title: "Auditorium Parco della Musica", caption: "The Auditorium Parco della Musica in Rome, one of his civic landmarks.", after: 2 },
    { title: "The New York Times Building", caption: "The New York Times Building in Manhattan, one of his towers.", after: 3 },
  ],
  "federico-faggin": [
    { work: true, caption: "The Intel 4004, the first commercial microprocessor.", after: 3 },
    { title: "Zilog Z80", caption: "The Zilog Z80, the chip from the company he co-founded.", after: 3 },
    { title: "Touchscreen", caption: "The touchscreen, an interface his later company helped pioneer.", after: 4 },
  ],
  "giorgio-parisi": [
    { work: true, caption: "Spin glasses, the disordered systems at the heart of his Nobel work.", after: 3 },
    { title: "Flocking (behavior)", caption: "Flocking starlings, complex collective behaviour he also studied.", after: 3 },
  ],
};

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
  const page = Object.values(json.query?.pages || {})[0];
  const src = page?.imageinfo?.[0]?.url;
  if (!src) throw new Error(`no commons image for "${fileTitle}"`);
  return src;
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
  const rel = `${basePath}.${ext}`;
  if (existing.has(rel)) return `/images/pioneers/${rel}`;
  const res = await fetchRetry(u, { headers: { "User-Agent": UA } }, u);
  if (!res.ok) throw new Error(`download ${res.status} for ${u}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, rel), buf);
  existing.add(rel);
  return `/images/pioneers/${rel}`;
}

function tsString(value) {
  return JSON.stringify(value);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const existing = new Set(await readdir(OUT_DIR).catch(() => []));

  const findExisting = (base) => {
    const hit = [...existing].find((f) => f.replace(/\.[^.]+$/, "") === base);
    return hit ? `/images/pioneers/${hit}` : null;
  };

  const media = {};

  for (const [slug, items] of Object.entries(EXTRA)) {
    const out = [];
    let didNetwork = false;
    let imgIndex = 0;

    for (const item of items) {
      if (item.work) {
        const src = findExisting(`${slug}-work`);
        if (src) {
          out.push({ src, caption: item.caption, after: item.after });
          console.log(`work reuse  ${slug}`);
        } else {
          console.log(`work MISS   ${slug} (no existing work image)`);
        }
        continue;
      }

      imgIndex += 1;
      const base = `${slug}-g${imgIndex}`;
      const label = item.title || item.commons;
      const have = findExisting(base);
      if (have) {
        out.push({ src: have, caption: item.caption, after: item.after });
        console.log(`img skip    ${slug} <- ${label}`);
        continue;
      }

      try {
        const url = item.commons
          ? await commonsImage(item.commons)
          : await summaryImage(item.title);
        const src = await download(url, base, existing);
        out.push({ src, caption: item.caption, after: item.after });
        didNetwork = true;
        console.log(`img ok      ${slug} <- ${label}`);
      } catch (err) {
        console.log(`img FAIL    ${slug} <- ${label}: ${err.message}`);
      }
    }

    if (out.length) media[slug] = out;
    if (didNetwork) await sleep(600);
  }

  const lines = [];
  lines.push("// AUTO-GENERATED by scripts/fetch-pioneers-media.mjs");
  lines.push("// Contextual images per pioneer, interleaved into the biography.");
  lines.push("// `after` is the 0-based paragraph index the image appears after.");
  lines.push("");
  lines.push("export type PioneerMediaItem = {");
  lines.push("  src: string;");
  lines.push("  caption: string;");
  lines.push("  after: number;");
  lines.push("};");
  lines.push("");
  lines.push("export const PIONEER_MEDIA: Record<string, PioneerMediaItem[]> = {");
  for (const [slug, items] of Object.entries(media)) {
    lines.push(`  ${tsString(slug)}: [`);
    for (const it of items) {
      lines.push(
        `    { src: ${tsString(it.src)}, caption: ${tsString(it.caption)}, after: ${it.after} },`,
      );
    }
    lines.push("  ],");
  }
  lines.push("};");
  lines.push("");

  await writeFile(DATA_FILE, lines.join("\n"));
  console.log(`\nwrote ${DATA_FILE} (${Object.keys(media).length} figures)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
