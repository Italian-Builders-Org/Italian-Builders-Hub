import { Footer, Header, Join, useTechLabels } from "@/pages/Home";

export default function JoinPage() {
  const { techLabels } = useTechLabels();

  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <section className="bg-zinc-950 border-b border-zinc-800 pt-18 pb-10 md:pt-24 md:pb-14">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-xs font-mono text-blue-400 mb-3 font-semibold tracking-wider">
              {techLabels ? "> ACCESS_REQUEST --private-beta" : "Join the community"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-5 tracking-tight">
              Request access to Italian Builders.
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed">
              Tell us who you are, what you are building, and where the community can find your work.
            </p>
          </div>
        </section>
        <Join />
      </main>
      <Footer />
    </div>
  );
}
