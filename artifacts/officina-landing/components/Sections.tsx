import { Reveal } from "./Reveal";

/* ------------------------------------------------------------------ */
/* Perché esistiamo                                                    */
/* ------------------------------------------------------------------ */

export function Perche() {
  return (
    <section id="perche" className="border-b-2 border-ink">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <div className="mb-7 h-2 w-24 bg-rosso" aria-hidden="true" />
          <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Il talento c&rsquo;è.
            <br className="hidden md:block" /> Manca il sistema.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-12">
          <Reveal delay={80}>
            <p className="text-lg leading-relaxed text-ink/85">
              In Italia il talento tecnologico esiste già. Quello che manca è
              uno spazio fatto bene dove chi costruisce possa incontrarsi,
              confrontarsi e crescere insieme, invece di farlo da solo.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg leading-relaxed text-ink/85">
              Italian Builders nasce per colmare questo vuoto: una cultura che
              valorizza chi prova, tratta l&rsquo;errore come materiale di
              costruzione e trasforma l&rsquo;ambizione condivisa in progetti
              concreti.
            </p>
          </Reveal>
        </div>
        <Reveal delay={240}>
          <p className="mt-12 border-y-2 border-ink py-5 font-mono text-[13px] font-medium uppercase tracking-wide text-ink">
            Cultura interna{" "}
            <span aria-hidden="true" className="font-semibold text-rosso">&rarr;</span>{" "}
            esempio pubblico{" "}
            <span aria-hidden="true" className="font-semibold text-rosso">&rarr;</span>{" "}
            persone che crescono{" "}
            <span aria-hidden="true" className="font-semibold text-rosso">&rarr;</span>{" "}
            un ecosistema più forte
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cosa trovi: i quattro benefici della promessa di valore             */
/* ------------------------------------------------------------------ */

const BENEFICI = [
  {
    titolo: "Relazioni",
    testo:
      "Conosci persone affini e complementari: chi costruisce accanto a te, in Italia e nel mondo.",
  },
  {
    titolo: "Apprendimento",
    testo:
      "Ti confronti con chi ha esperienze, competenze e punti di vista diversi dai tuoi.",
  },
  {
    titolo: "Opportunità",
    testo: "Trovi collaborazioni, progetti, talenti ed eventi a cui unirti.",
  },
  {
    titolo: "Partecipazione",
    testo:
      "Contribuisci a qualcosa di più grande del tuo percorso individuale.",
  },
];

export function CosaTrovi() {
  return (
    <section id="cosa-trovi" className="border-b-2 border-ink">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <div className="mb-7 h-2 w-24 bg-verde" aria-hidden="true" />
          <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Cosa trovi dentro
          </h2>
        </Reveal>
        <div className="mt-12">
          {BENEFICI.map((b, i) => (
            <Reveal key={b.titolo} delay={i * 70}>
              <div className="group grid items-baseline gap-2 border-t-2 border-ink py-7 transition-transform duration-300 hover:translate-x-2 md:grid-cols-12 md:py-9">
                <h3 className="font-display text-2xl uppercase tracking-tight md:col-span-5 md:text-4xl">
                  <span className="mr-4 inline-block h-4 w-4 bg-verde align-baseline transition-transform duration-300 group-hover:scale-125" />
                  {b.titolo}
                </h3>
                <p className="max-w-[52ch] text-lg leading-relaxed text-ink/85 md:col-span-7">
                  {b.testo}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dove succede: Telegram                                              */
/* ------------------------------------------------------------------ */

const TOPICS = [
  { nome: "General Chat", vivo: true },
  { nome: "AI Focus", vivo: true },
  { nome: "Side Projects & Startup", vivo: false },
  { nome: "Community Projects", vivo: false },
  { nome: "AI Research", vivo: false },
  { nome: "Job Search", vivo: false },
  { nome: "Blockchain & Web3", vivo: false },
  { nome: "Risorse & Libri", vivo: false },
  { nome: "Fintech", vivo: false },
];

export function Community() {
  return (
    <section id="community" className="border-b-2 border-ink">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <div className="mb-7 h-2 w-24 bg-rosso" aria-hidden="true" />
          <h2 className="max-w-[22ch] font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Una community viva, non una mailing list
          </h2>
        </Reveal>
        <Reveal className="mt-12">
          <div className="border-2 border-ink p-7 md:p-10">
            <h3 className="font-display text-2xl uppercase tracking-tight">
              La conversazione: Telegram
            </h3>
            <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink/85">
              Accesso controllato, zero spam, confronto vero: ogni giorno,
              dai side project alla ricerca AI. I topic più vivi sono
              General Chat e AI Focus.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {TOPICS.map((t) => (
                <li
                  key={t.nome}
                  className={
                    t.vivo
                      ? "bg-ink px-3.5 py-2 font-mono text-[13px] text-paper"
                      : "border border-ink/40 px-3.5 py-2 font-mono text-[13px] text-ink/85"
                  }
                >
                  {t.nome}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Open source: Magistra                                               */
/* ------------------------------------------------------------------ */

const PIPELINE = [
  {
    titolo: "Fonti ufficiali",
    testo: "Normattiva, Gazzetta Ufficiale, EUR-Lex",
  },
  {
    titolo: "Ricerca semantica",
    testo: "per concetto, non solo per parola chiave",
  },
  {
    titolo: "Risposte con citazioni",
    testo: "articolo, comma e fonte sempre verificabili",
  },
];

export function Magistra() {
  return (
    <section id="open-source" className="border-b-2 border-ink">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 md:grid-cols-12 md:gap-8 md:px-8 md:py-28">
        <div className="md:col-span-6">
          <Reveal>
            <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink">
              <span className="inline-block h-2.5 w-2.5 bg-verde" aria-hidden="true" />
              Open source
            </p>
            <h2 className="mt-5 max-w-[14ch] font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
              Il codice è la nostra prova
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink/85">
              Il primo progetto della community è Magistra: un assistente AI
              open source per la legislazione italiana. Ideato, gestito e
              costruito da Italian Builders, con privacy by design: i tuoi
              documenti restano sulla tua macchina.
            </p>
            <a
              href="https://github.com/Italian-Builders-Org/magistra"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block border-b-2 border-ink pb-1 text-base font-semibold transition-opacity hover:opacity-70"
            >
              Segui Magistra su GitHub
            </a>
          </Reveal>
        </div>
        <Reveal axis="right" delay={120} className="md:col-span-6">
          <div className="border-2 border-ink p-7 md:p-9">
            <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink">
              <span className="inline-block h-2.5 w-2.5 bg-verde" aria-hidden="true" />
              In sviluppo aperto
            </p>
            <ol className="mt-7 space-y-0">
              {PIPELINE.map((step, i) => (
                <li key={step.titolo} className="relative pb-7 pl-7 last:pb-0">
                  {i < PIPELINE.length - 1 && (
                    <span
                      className="absolute left-[5px] top-4 h-full w-0.5 bg-ink"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`absolute left-0 top-1.5 h-3 w-3 border-2 ${
                      i === PIPELINE.length - 1
                        ? "border-verde bg-verde"
                        : "border-ink bg-paper"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg uppercase tracking-tight">
                    {step.titolo}
                  </p>
                  <p className="mt-1 text-ink/70">{step.testo}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t-2 border-ink pt-5 font-mono text-[13px] font-medium uppercase tracking-wide text-ink">
              TypeScript, app desktop locale, licenza AGPL-3.0
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
