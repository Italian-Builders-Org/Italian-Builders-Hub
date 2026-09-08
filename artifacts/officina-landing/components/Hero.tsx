import { MarkMatrix } from "./MarkMatrix";

const PROOF = [
  "750+ membri su Telegram",
  "Confronto ogni giorno",
  "Nata il 12 giugno 2026",
  "Open source su GitHub",
];

export function Hero() {
  return (
    <section id="top" className="border-b-2 border-ink">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-12 md:gap-8 md:px-8 md:pb-24 md:pt-20">
        <div className="md:col-span-7">
          <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink">
            <span className="inline-block h-2.5 w-2.5 bg-verde" aria-hidden="true" />
            Connecting people who build.
          </p>
          <h1 className="mt-6 font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-6xl md:leading-[1.02]">
            La community di chi costruisce nel tech italiano.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink/85">
            Relazioni, conoscenza, progetti e opportunità per le persone
            italiane che costruiscono nel tech, in Italia e all&rsquo;estero.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="https://x.com/italianbldrs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink px-7 py-4 text-base font-semibold text-paper transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Scrivi su X per entrare
            </a>
            <a
              href="#cosa-trovi"
              className="border-b-2 border-ink pb-1 text-base font-semibold transition-opacity hover:opacity-70"
            >
              Scopri cosa trovi
            </a>
          </div>
        </div>

        <div className="md:col-span-5">
          <MarkMatrix
            animated
            className="mx-auto w-full max-w-[300px] md:max-w-[400px]"
          />
        </div>
      </div>

      <div className="bg-ink">
        <ul className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-4">
          {PROOF.map((item, i) => (
            <li
              key={item}
              className={`px-5 py-5 font-mono text-[13px] uppercase tracking-wide text-paper md:px-8 ${
                i > 0 ? "border-l border-paper/25" : ""
              } ${i >= 2 ? "max-md:border-t max-md:border-paper/25" : ""} ${
                i === 2 ? "max-md:border-l-0" : ""
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
