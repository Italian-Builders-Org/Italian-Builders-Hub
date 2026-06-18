import { ArrowRight, Code2, Database, Server } from "lucide-react";
import { getListOsProjectsQueryKey, useListOsProjects } from "@workspace/api-client-react";
import { Header, Footer, useTechLabels } from "@/pages/Home";
import type React from "react";
import { STATIC_OS_PROJECTS, hasItems } from "@/data/directory";

const OS_PROJECT_ICONS: Record<string, React.FC<any>> = {
  Database,
  Code2,
  Server,
};

export default function OpenSourcePage() {
  const { techLabels } = useTechLabels();
  const { data: osProjectsData, isLoading } = useListOsProjects({
    query: { queryKey: getListOsProjectsQueryKey() },
  });
  const osProjects = hasItems(osProjectsData) ? osProjectsData : STATIC_OS_PROJECTS;

  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <section className="bg-zinc-950 border-b border-zinc-800 pt-18 pb-12 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-xs font-mono text-blue-400 mb-3 font-semibold tracking-wider">
              {techLabels ? "> GIT_CLONE --community" : "Open-source projects"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-5 tracking-tight">
              Shared infrastructure for Italian builders.
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed">
              Community-maintained projects that make discovery, collaboration, and open building easier.
            </p>
          </div>
        </section>

        <section className="bg-zinc-950 py-14 md:py-18">
          <div className="container mx-auto px-4 md:px-6">
            {isLoading ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "LOADING_REPOS..." : "Loading projects..."}</div>
            ) : osProjects.length === 0 ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "NO_OS_PROJECTS_RETURNED" : "No open-source projects found yet."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {osProjects.map((project) => {
                  const Icon = OS_PROJECT_ICONS[project.icon] || Code2;
                  return (
                    <article key={project.id} className="dt-card p-5 group flex flex-col hover:border-blue-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center ${project.color} group-hover:border-blue-500/40 transition-colors`}>
                          <Icon size={17} />
                        </div>
                        <span className="text-[10px] font-mono border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-500 uppercase rounded-sm">
                          {project.status}
                        </span>
                      </div>
                      <h2 className="font-bold text-base text-zinc-100 mb-2">{project.title}</h2>
                      <p className="text-sm text-zinc-400 mb-6 flex-grow">{project.description}</p>
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-4 border-t border-zinc-800">
                        <span className="uppercase">{project.category}</span>
                        <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
                          {techLabels ? "VIEW_REPO" : "View project"} <ArrowRight size={12} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
