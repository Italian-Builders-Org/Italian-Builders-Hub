import { ArrowRight } from "lucide-react";
import { getListProjectsQueryKey, useListProjects } from "@workspace/api-client-react";
import { romanHeroProps } from "@/components/RomanAccent";
import { Header, Footer, useTechLabels } from "@/pages/Home";
import { STATIC_PROJECTS, hasItems } from "@/data/directory";

export default function ProjectsPage() {
  const { techLabels } = useTechLabels();
  const { data: projectsData, isLoading } = useListProjects(undefined, {
    query: { queryKey: getListProjectsQueryKey() },
  });
  const projects = hasItems(projectsData) ? projectsData : STATIC_PROJECTS;

  const categories = Array.from(new Set(projects.map((project) => project.category)));
  const heroBackground = romanHeroProps("projects");

  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <section
          className={`bg-zinc-950 border-b border-zinc-800 pt-18 pb-12 md:pt-24 md:pb-16 ${heroBackground.className}`}
          style={heroBackground.style}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <div className="text-xs font-mono text-blue-400 mb-3 font-semibold tracking-wider">
                {techLabels ? "> ARTIFACT_REGISTRY --public" : "Project showcase"}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-5 tracking-tight dt-roman-display">
                Products shipping from the network.
              </h1>
              <p className="text-base text-zinc-400 leading-relaxed">
                A public-facing showcase of software, tools, and experiments built by Italian founders and technical contributors.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-14 md:py-18">
          <div className="container mx-auto px-4 md:px-6">
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto dt-scrollbar pb-3 mb-8 md:flex-wrap">
                {categories.map((category) => (
                  <span key={category} className="px-3 py-1 text-xs font-mono uppercase border border-zinc-800 bg-zinc-900 text-zinc-400 rounded-sm">
                    {category}
                  </span>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "LOADING_PROJECTS..." : "Loading projects..."}</div>
            ) : projects.length === 0 ? (
              <div className="dt-card p-6 text-sm font-mono text-zinc-500">{techLabels ? "NO_PROJECTS_RETURNED" : "No projects found yet."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <article key={project.id} className="group dt-card flex flex-col">
                    <div className="aspect-[1200/630] w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
                      <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border rounded-sm ${project.statusColor} backdrop-blur-sm`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h2 className="font-bold text-base text-zinc-100 leading-tight">{project.name}</h2>
                        <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900 rounded-sm shrink-0">{project.category}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">{project.description}</p>
                      <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={project.avatarUrl} alt={project.builder} className="w-5 h-5 rounded-sm border border-zinc-700 grayscale" />
                          <span className="text-xs font-mono text-zinc-300 truncate">{project.builder}</span>
                        </div>
                        <ArrowRight size={14} className="text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
