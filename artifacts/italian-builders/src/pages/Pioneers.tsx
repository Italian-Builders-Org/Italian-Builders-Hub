import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import { Footer, Header, useTechLabels } from "@/pages/Home";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PIONEERS,
  PIONEER_CATEGORIES,
  type Pioneer,
} from "@/data/pioneers";
import { PIONEER_MEDIA, type PioneerMediaItem } from "@/data/pioneersMedia";
import { RomanEyebrow, RomanStatue, ROMAN_STATUES, romanHeroProps } from "@/components/RomanAccent";

const ALL = "All";

function MediaFigure({ item }: { item: PioneerMediaItem }) {
  return (
    <figure className="my-4 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
      <div className="aspect-[16/10] w-full overflow-hidden">
        <img
          src={item.src}
          alt={item.caption}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>
      <figcaption className="border-t border-zinc-800 px-3 py-2 text-[11px] font-mono text-zinc-500">
        {item.caption}
      </figcaption>
    </figure>
  );
}

function BioBody({ pioneer }: { pioneer: Pioneer }) {
  const headerImage = pioneer.portrait ?? pioneer.work?.image;
  const media = (PIONEER_MEDIA[pioneer.slug] ?? []).filter(
    (item) => item.src !== headerImage,
  );
  const lastIndex = pioneer.bio.length - 1;
  const trailing = media.filter((item) => item.after > lastIndex || item.after < 0);

  return (
    <div className="text-[15px] leading-7 text-zinc-300">
      {pioneer.bio.map((paragraph, index) => (
        <div key={paragraph.slice(0, 32)}>
          <p
            className={
              index === 0
                ? "text-zinc-200 first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-serif first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.7] first-letter:text-[hsl(38_62%_58%)]"
                : "mt-4"
            }
          >
            {paragraph}
          </p>
          {media
            .filter((item) => item.after === index)
            .map((item) => (
              <MediaFigure key={item.src} item={item} />
            ))}
        </div>
      ))}
      {trailing.map((item) => (
        <MediaFigure key={item.src} item={item} />
      ))}
    </div>
  );
}

function PioneerCard({
  pioneer,
  onOpen,
}: {
  pioneer: Pioneer;
  onOpen: (pioneer: Pioneer) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(pioneer)}
      className="group dt-card flex flex-col overflow-hidden text-left transition-colors hover:border-blue-500/50"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-zinc-800 bg-zinc-900">
        <img
          src={pioneer.portrait ?? pioneer.work?.image}
          alt={pioneer.name}
          loading="lazy"
          className="h-full w-full object-cover object-top grayscale brightness-[0.85] transition-all duration-300 group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:brightness-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent transition-opacity duration-300 group-hover:opacity-75" />
        <span className="dt-tag absolute left-2 top-2 rounded-sm border border-zinc-700 bg-zinc-950/80 px-1.5 py-0.5 text-[9px] text-zinc-300 backdrop-blur-sm">
          {pioneer.category}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-sm font-bold leading-tight text-zinc-50">
            {pioneer.name}
          </h3>
          <div className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            {pioneer.role} · {pioneer.lifespan}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 flex-grow text-sm leading-relaxed text-zinc-400">
          {pioneer.tagline}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-400 transition-colors group-hover:text-blue-300">
          Read biography
          <ArrowUpRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </button>
  );
}

function PioneerDialog({
  pioneer,
  onClose,
}: {
  pioneer: Pioneer | null;
  onClose: () => void;
}) {
  const { techLabels } = useTechLabels();

  return (
    <Dialog open={Boolean(pioneer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] w-[calc(100vw-1.5rem)] max-w-2xl gap-0 overflow-y-auto rounded-sm border-zinc-800 bg-zinc-950 p-0 text-zinc-200 dt-scrollbar">
        {pioneer && (
          <>
            <div className="relative border-b border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <img
                  src={pioneer.portrait ?? pioneer.work?.image}
                  alt={pioneer.name}
                  className="h-20 w-20 shrink-0 rounded-sm border border-zinc-700 object-cover object-top sm:h-24 sm:w-24"
                />
                <div className="min-w-0 pr-6">
                  <span className="dt-tag inline-block rounded-sm border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-300">
                    {pioneer.category}
                  </span>
                  <DialogTitle className="mt-2 text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
                    {pioneer.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs font-mono uppercase tracking-wider text-zinc-400">
                    {pioneer.role} · {pioneer.lifespan}
                  </DialogDescription>
                  <div className="mt-1 text-xs font-mono text-zinc-500">
                    {pioneer.origin} · {pioneer.era}
                  </div>
                </div>
              </div>
              <p className="mt-4 border-l-2 border-[hsl(38_35%_42%/0.45)] pl-3 text-sm italic leading-relaxed text-zinc-300 dt-roman-quote">
                {pioneer.tagline}
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="rounded-sm border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">
                  <Sparkles size={12} />
                  {techLabels ? "WHY_THIS_MATTERS" : "Why they matter"}
                </div>
                <p className="text-sm leading-relaxed text-zinc-200">
                  {pioneer.whyGreat}
                </p>
              </div>

              {pioneer.facts && pioneer.facts.length > 0 && (
                <div>
                  <div className="mb-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    {techLabels ? "QUICK_FACTS" : "Quick facts"}
                  </div>
                  <dl className="grid grid-cols-1 gap-x-5 gap-y-2.5 rounded-sm border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-2">
                    {pioneer.facts.map((fact) => (
                      <div key={fact.label} className="flex flex-col gap-0.5">
                        <dt className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          {fact.label}
                        </dt>
                        <dd className="text-sm text-zinc-200">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center gap-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  <span>{techLabels ? "BIOGRAPHY" : "The story"}</span>
                  <span className="h-px flex-1 bg-zinc-800" />
                </div>
                <BioBody pioneer={pioneer} />
              </div>

              <div>
                <div className="mb-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  {techLabels ? "KEY_CONTRIBUTIONS" : "Key contributions"}
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {pioneer.contributions.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 rounded-sm border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {pioneer.fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-sm border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400"
                    >
                      {field}
                    </span>
                  ))}
                </div>
                <a
                  href={pioneer.wikipedia}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-blue-500/60 hover:text-white"
                >
                  {techLabels ? "SOURCE" : "Learn more"}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PioneersPage() {
  const { techLabels } = useTechLabels();
  const [category, setCategory] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Pioneer | null>(null);

  const filters = useMemo(() => [ALL, ...PIONEER_CATEGORIES], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PIONEERS.filter((pioneer) => {
      const matchesCategory =
        category === ALL || pioneer.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        pioneer.name.toLowerCase().includes(q) ||
        pioneer.role.toLowerCase().includes(q) ||
        pioneer.tagline.toLowerCase().includes(q) ||
        pioneer.fields.some((field) => field.toLowerCase().includes(q))
      );
    }).sort((a, b) => a.birthYear - b.birthYear);
  }, [category, query]);

  const heroBackground = romanHeroProps("pantheon");

  return (
    <div className="dark-technical-theme min-h-screen bg-zinc-950">
      <Header />
      <main>
        <section
          className={`relative overflow-hidden border-b border-zinc-800 bg-zinc-950 pt-16 pb-12 md:pt-24 md:pb-16 ${heroBackground.className}`}
          style={heroBackground.style}
        >
          <div className="absolute inset-0 dt-grid-bg opacity-[0.5] pointer-events-none" />
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
          <RomanStatue
            src={ROMAN_STATUES.nike}
            side="right"
            variant="hero"
            className="hidden sm:block"
          />
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <RomanEyebrow className="mb-4">
                {techLabels ? "Pantheon" : "Pantheon"}
              </RomanEyebrow>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 md:text-6xl dt-roman-display">
                The Italians who built the future.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                A living library of the greatest Italian inventors, scientists,
                artists, explorers and builders across more than two thousand
                years. The minds whose curiosity and craft shaped the modern
                world, driven by the same instinct to create that connects this
                community today.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto dt-scrollbar pb-1 md:flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCategory(filter)}
                  className={`dt-tag flex-shrink-0 rounded-sm border px-3 py-1 text-xs transition-colors ${
                    category === filter
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-xs lg:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  techLabels ? "GREP --name --field" : "Search the Pantheon..."
                }
                className="h-9 w-full rounded-sm border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="dt-card p-6 text-sm font-mono text-zinc-500">
              {techLabels ? "NO_MATCHES" : "No one in the Pantheon matches your search."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((pioneer) => (
                <PioneerCard
                  key={pioneer.slug}
                  pioneer={pioneer}
                  onOpen={setActive}
                />
              ))}
            </div>
          )}

          <p className="mt-10 border-t border-zinc-900 pt-6 text-xs leading-relaxed text-zinc-600">
            A curated, evolving selection, not a ranking. Many more Italian
            builders deserve a place here.{" "}
            {techLabels ? "// " : ""}Images via Wikimedia Commons.
          </p>
        </section>
      </main>
      <Footer />

      <PioneerDialog pioneer={active} onClose={() => setActive(null)} />
    </div>
  );
}
