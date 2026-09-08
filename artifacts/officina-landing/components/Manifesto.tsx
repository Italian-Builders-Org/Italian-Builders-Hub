import { Reveal } from "./Reveal";

/*
 * Unico blocco scuro della pagina: i principi e il motto, il momento
 * manifesto del brand. Variante "Officina scura" del sistema approvato.
 */

const PRINCIPI = [
  {
    titolo: "Costruire rende credibile il dire",
    testo:
      "Valutiamo le idee anche attraverso ciò che producono: progetti, relazioni e apprendimenti osservabili.",
  },
  {
    titolo: "La competenza cresce quando circola",
    testo:
      "Condividiamo conoscenze e strumenti per alzare il livello collettivo, non per creare distanza.",
  },
  {
    titolo: "L'ambizione non è arroganza",
    testo:
      "Puntare in alto significa aumentare possibilità e aspettative, non sentirsi superiori.",
  },
  {
    titolo: "L'errore è materiale di costruzione",
    testo:
      "Sperimentare, sbagliare e raccontare ciò che si è imparato è parte del progresso.",
  },
  {
    titolo: "Il talento cresce nelle relazioni",
    testo:
      "Le persone migliorano quando trovano confronto, fiducia, collaborazione e opportunità.",
  },
  {
    titolo: "L'italianità è una responsabilità",
    testo:
      "Valorizzare l'Italia significa contribuire concretamente al suo futuro, non celebrarne il passato.",
  },
];

export function Manifesto() {
  return (
    <section id="principi" className="bg-ink text-paper">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-32">
        <Reveal>
          <div className="mb-7 h-2 w-24 bg-rosso" aria-hidden="true" />
          <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Sei principi, un modo di costruire
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-x-14 gap-y-11 md:grid-cols-2">
          {PRINCIPI.map((p, i) => (
            <Reveal key={p.titolo} delay={(i % 2) * 90}>
              <div className="border-t-2 border-paper/50 pt-6">
                <h3 className="font-display text-xl uppercase leading-snug tracking-tight md:text-2xl">
                  {p.titolo}
                </h3>
                <p className="mt-3 max-w-[52ch] leading-relaxed text-paper/85">
                  {p.testo}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-24 text-center font-display text-3xl uppercase leading-[1.15] tracking-tight md:mt-32 md:text-7xl">
            Dall&rsquo;Italia.
            <br />
            Per l&rsquo;Italia.
            <br />
            Per l&rsquo;Europa.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
