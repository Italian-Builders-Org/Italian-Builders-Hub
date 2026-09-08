import { Reveal } from "./Reveal";

/* ------------------------------------------------------------------ */
/* Per chi: il nastro dei profili e il criterio di appartenenza        */
/* ------------------------------------------------------------------ */

const PROFILI = [
  "Developer",
  "Founder",
  "Designer",
  "Ricercatori",
  "Creator tecnici",
  "Studenti",
  "Italiani all'estero",
];

function NastroProfili() {
  const banda = (ariaHidden: boolean) => (
    <div
      className="flex shrink-0 items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {PROFILI.map((p) => (
        <span key={p} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-2xl uppercase tracking-tight text-ink md:px-9 md:text-4xl">
            {p}
          </span>
          <span className="h-3.5 w-3.5 shrink-0 bg-verde" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y-2 border-ink py-6">
      <div className="marquee-track flex w-max">
        {banda(false)}
        {banda(true)}
      </div>
    </div>
  );
}

export function PerChi() {
  return (
    <section id="per-chi" className="border-b-2 border-ink">
      <div className="mx-auto max-w-[1280px] px-5 pt-20 md:px-8 md:pt-28">
        <Reveal>
          <div className="mb-7 h-2 w-24 bg-verde" aria-hidden="true" />
          <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Conta l&rsquo;atteggiamento,
            <br className="hidden md:block" /> non il titolo
          </h2>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink/85">
            Non serve aver già costruito qualcosa di grande. Serve la voglia di
            imparare, confrontarsi e costruire: da qualsiasi disciplina e da
            qualsiasi parte del mondo.
          </p>
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16">
        <NastroProfili />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Come entrare + invito finale                                        */
/* ------------------------------------------------------------------ */

export function Accesso() {
  return (
    <section id="accesso">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8 md:items-end">
          <Reveal className="md:col-span-7">
            <div className="mb-7 h-2 w-24 bg-rosso" aria-hidden="true" />
            <h2 className="max-w-[18ch] font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
              Per entrare, scrivici su X
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink/85">
              Invia un messaggio privato al profilo{" "}
              <a
                href="https://x.com/italianbldrs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4 hover:text-rosso"
              >
                @italianbldrs
              </a>
              : da lì ricevi l&rsquo;accesso alla community su Telegram.
            </p>
          </Reveal>
          <Reveal delay={120} className="md:col-span-5 md:text-right">
            <a
              href="https://x.com/italianbldrs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-ink px-8 py-4 text-base font-semibold text-paper transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Scrivi su X
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="border-t-2 border-ink">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Italian Builders" className="h-7 w-auto" />
          <p className="mt-4 font-mono text-[13px] uppercase tracking-wide text-ink">
            Connecting people who build.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <nav className="flex gap-6" aria-label="Canali di Italian Builders">
            <a
              href="https://x.com/italianbldrs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-semibold underline-offset-4 hover:underline"
            >
              X
            </a>
            <a
              href="https://github.com/Italian-Builders-Org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-semibold underline-offset-4 hover:underline"
            >
              GitHub
            </a>
          </nav>
          <p className="text-[13px] text-ink/80">
            Italian Builders, 2026. La community di chi costruisce nel tech
            italiano.
          </p>
        </div>
      </div>
    </footer>
  );
}
