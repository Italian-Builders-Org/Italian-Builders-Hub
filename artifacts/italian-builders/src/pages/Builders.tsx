import { ArrowRight, MapPin, Terminal } from "lucide-react";
import {
  getGetDirectoryStatsQueryKey,
  getListBuildersQueryKey,
  useGetDirectoryStats,
  useListBuilders,
} from "@workspace/api-client-react";
import { romanHeroProps } from "@/components/RomanAccent";
import { Header, Footer, useTechLabels } from "@/pages/Home";
import { STATIC_BUILDERS, STATIC_DIRECTORY_STATS, hasItems, isDirectoryStats } from "@/data/directory";

export default function BuildersPage() {
  const { techLabels } = useTechLabels();
  const { data: buildersData, isLoading } = useListBuilders({
    query: { queryKey: getListBuildersQueryKey() },
  });
  const { data: statsData } = useGetDirectoryStats({
    query: { queryKey: getGetDirectoryStatsQueryKey() },
  });
  const builders = hasItems(buildersData) ? buildersData : STATIC_BUILDERS;
  const stats = isDirectoryStats(statsData) ? statsData : STATIC_DIRECTORY_STATS;
  const heroBackground = romanHeroProps("builders");

  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <section
          className={`bg-zinc-950 border-b border-zinc-800 pt-18 pb-12 md:pt-24 md:pb-16 ${heroBackground.className}`}
          style={heroBackground.style}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="text-xs font-mono text-blue-400 mb-3 font-semibold tracking-wider">
                  {techLabels ? "> DIRECTORY_SCAN --verified" : "Builder directory"}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-5 tracking-tight dt-roman-display">
                  Italian builder graph.
                </h1>
                <p className="text-base text-zinc-400 max-w-2xl leading-relaxed">
                  A focused index of founders, makers, technical contributors, and operators building from Italy.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-px dt-border bg-zinc-800">
                {[
                  { label: "Builders", value: stats.builders },
                  { label: "Regions", value: stats.regions },
                  { label: "Cities", value: stats.cities },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-950 px-3 py-4 text-center">
                    <div className="text-xl font-bold text-zinc-100">{stat.value}</div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-14 md:py-18">
          <div className="container mx-auto px-4 md:px-6">
            {isLoading ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "LOADING_BUILDERS..." : "Loading builders..."}</div>
            ) : builders.length === 0 ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "NO_BUILDERS_RETURNED" : "No builders found yet."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {builders.map((builder) => (
                  <article key={builder.id} className="dt-card p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={builder.avatarUrl} alt={builder.name} className="w-12 h-12 object-cover border border-zinc-700 grayscale rounded-sm" />
                        <div className="min-w-0">
                          <h2 className="font-bold text-zinc-100 truncate">{builder.name}</h2>
                          <p className="text-xs font-mono text-zinc-500">{builder.role}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase shrink-0">
                        <MapPin size={10} /> {builder.location}
                      </span>
                    </div>
                    <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-zinc-300">"{builder.highlight}"</p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {builder.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-[10px] font-mono text-zinc-400 uppercase rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-zinc-900/40 border-y border-zinc-800 py-12">
          <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
                <Terminal size={14} /> {techLabels ? "CONTRIBUTOR_PIPELINE" : "Want to join?"}
              </div>
              <h2 className="text-2xl font-bold text-zinc-50">Want to be indexed?</h2>
            </div>
            <a href="/join" className="inline-flex items-center justify-center h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono uppercase dt-button rounded-sm">
              {techLabels ? "Request_Access" : "Request access"} <ArrowRight size={14} className="ml-2" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
