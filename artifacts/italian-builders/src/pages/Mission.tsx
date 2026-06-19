import { ArrowRight } from "lucide-react";
import { Footer, Header, useTechLabels } from "@/pages/Home";

const missionParagraphs = [
  "Italian Builders exists to connect people who build.",
  "Our goal is to create the home for Italian builders of all ages and experience levels, a place where ideas, projects, knowledge, and opportunities can be shared.",
  "We believe talent is not the problem.",
  "Across Italy, developers, designers, founders, creators, researchers, and entrepreneurs are building remarkable products, companies, and technologies every day. Too often, however, these people remain isolated, work alone, or never meet the collaborators, partners, investors, or friends who could help them take the next step.",
  "Our mission is to make those connections easier, more frequent, and more natural.",
  "We want to create a space where people can meet, share what they are building, exchange ideas, collaborate, and bring new projects to life together.",
  "We believe the best opportunities are born from relationships, and that great projects are often the result of the right people meeting at the right time.",
  "Whether it's software, startups, open-source projects, artificial intelligence, hardware, content, automation, or any other form of creation, what unites us is not what we build.",
  "What unites us is that we choose to build.",
];

export default function MissionPage() {
  const { techLabels } = useTechLabels();

  return (
    <div className="dark-technical-theme min-h-screen bg-zinc-950">
      <Header />
      <main>
        <section className="border-b border-zinc-900 bg-zinc-950 pt-20 pb-14 md:pt-28 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl">
              <div className="mb-4 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
                {techLabels ? "MISSION_STATEMENT" : "Mission"}
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 md:text-6xl">
                Italian Builders exists to connect people who build.
              </h1>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <article className="max-w-3xl space-y-6 text-lg leading-8 text-zinc-300 md:text-xl md:leading-9">
                {missionParagraphs.slice(1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>

              <aside className="border-l border-zinc-800 pl-5 text-sm leading-6 text-zinc-500">
                <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  {techLabels ? "CORE_SIGNAL" : "Core idea"}
                </div>
                <p className="mb-5 text-zinc-300">
                  What unites us is that we choose to build.
                </p>
                <a
                  href="/join"
                  className="inline-flex items-center gap-2 rounded-sm border border-blue-500/40 px-3 py-2 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-400 hover:text-white"
                >
                  {techLabels ? "REQUEST_ACCESS" : "Join the community"}
                  <ArrowRight size={14} />
                </a>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
