import React, { useState, useRef, useEffect } from "react";
import createGlobe from "cobe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Menu, X, ArrowRight, Twitter, Linkedin, Globe, Link as LinkIcon,
  CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, MapPin,
  Terminal, Activity, Database, Server, Code2, Command
} from "lucide-react";
import "./DarkTechnical.css";

// --- Mock Data ---

const OS_PROJECTS = [
  {
    title: "ib-directory-api",
    description: "REST API for querying active builders, products, and startups in the ecosystem.",
    status: "v1.0.0-rc",
    category: "Directory",
    icon: Database,
    color: "text-blue-400"
  },
  {
    title: "builder-profile-schema",
    description: "JSON schema definitions for public builder profiles and portfolio aggregation.",
    status: "rfc",
    category: "Profiles",
    icon: Code2,
    color: "text-zinc-400"
  },
  {
    title: "showcase-protocol",
    description: "Decentralized protocol for launching and voting on community projects.",
    status: "v0.9.0",
    category: "Showcase",
    icon: Server,
    color: "text-indigo-400"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  },
  {
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    image: "/__mockup/images/project-7.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "DevKit",
    category: "DevTools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  }
];

const WHO_FOR = [
  {
    title: "Builders",
    description: "For people building apps, products, startups, and tools.",
    icon: Terminal
  },
  {
    title: "Contributors",
    description: "For developers, designers, marketers, and makers who want to collaborate.",
    icon: Code2
  },
  {
    title: "Supporters",
    description: "For mentors, advisors, and people who want to help the ecosystem grow.",
    icon: Activity
  },
  {
    title: "Investors & Scouts",
    description: "For people looking for early projects, promising builders, and emerging talent.",
    icon: Database
  }
];

const ROLES = [
  "Builder", "Developer", "Designer", "Founder", "Investor", "Student", "Supporter", "Other"
];

// Approximate [lat, lng] for each builder's home city — drives the globe pins.
const CITY_COORDS: Record<string, [number, number]> = {
  Milano: [45.4642, 9.19],
  Torino: [45.0703, 7.6869],
  Bologna: [44.4949, 11.3426],
  Roma: [41.9028, 12.4964],
  Napoli: [40.8518, 14.2681],
  Firenze: [43.7696, 11.2558],
  Verona: [45.4384, 10.9916],
  Palermo: [38.1157, 13.3615],
  Genova: [44.4056, 8.9463],
  Padova: [45.4064, 11.8768],
};

const BUILDERS = [
  { name: "Marco Rossi", role: "Founder", location: "Milano", avatar: "/__mockup/images/avatar-1.png", highlight: "Bootstrapping Supersync to $12k MRR, solo.", tags: ["SaaS", "DevTools"] },
  { name: "Sofia Bianchi", role: "AI Engineer", location: "Torino", avatar: "/__mockup/images/avatar-2.png", highlight: "Shipping generative UI tooling with Lumina AI.", tags: ["AI", "Design"] },
  { name: "Luca Ferrari", role: "Infra Developer", location: "Bologna", avatar: "/__mockup/images/avatar-3.png", highlight: "Building Postgres branching for preview envs.", tags: ["DevTools", "Open Source"] },
  { name: "Giulia Romano", role: "Product Lead", location: "Roma", avatar: "/__mockup/images/avatar-4.png", highlight: "Designing a CRM for boutique agencies.", tags: ["B2B", "SaaS"] },
  { name: "Alessandro Conti", role: "Founder", location: "Napoli", avatar: "/__mockup/images/avatar-5.png", highlight: "Fiat-to-crypto rails for EU merchants.", tags: ["Crypto", "Fintech"] },
  { name: "Elena Marino", role: "Creator", location: "Firenze", avatar: "/__mockup/images/avatar-6.png", highlight: "Open-source storefront for digital creators.", tags: ["Open Source", "E-commerce"] },
  { name: "Davide Greco", role: "Indie Hacker", location: "Verona", avatar: "/__mockup/images/avatar-1.png", highlight: "Automating boring ops with no-code flows.", tags: ["Automation", "No-Code"] },
  { name: "Chiara Esposito", role: "Designer & Dev", location: "Palermo", avatar: "/__mockup/images/avatar-2.png", highlight: "Crafting calm consumer apps for iOS.", tags: ["Consumer Apps", "Mobile"] },
  { name: "Matteo Galli", role: "Solo Founder", location: "Genova", avatar: "/__mockup/images/avatar-3.png", highlight: "AI copilots for indie developers.", tags: ["AI", "DevTools"] },
  { name: "Francesca Lombardi", role: "Growth", location: "Padova", avatar: "/__mockup/images/avatar-4.png", highlight: "Scaling a B2C habit-tracking app to 50k users.", tags: ["B2C", "Mobile"] },
];

// --- Sub-components ---

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-zinc-900 flex items-center justify-center font-mono text-xs font-bold leading-none">
            IT
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100 uppercase">ITALIAN_BUILDERS</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#builders" className="text-xs font-mono text-zinc-500 hover:text-zinc-100 transition-colors uppercase">/builders</a>
          <a href="#projects" className="text-xs font-mono text-zinc-500 hover:text-zinc-100 transition-colors uppercase">/projects</a>
          <a href="#os-projects" className="text-xs font-mono text-zinc-500 hover:text-zinc-100 transition-colors uppercase">/os-projects</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#join" className="text-xs font-mono text-zinc-400 hover:text-zinc-100 uppercase">Sign_In</a>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono uppercase dt-button rounded-sm">
            Join_Waitlist
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            <a href="#builders" className="text-sm font-mono text-zinc-400 uppercase">/builders</a>
            <a href="#projects" className="text-sm font-mono text-zinc-400 uppercase">/projects</a>
            <a href="#os-projects" className="text-sm font-mono text-zinc-400 uppercase">/os-projects</a>
          </nav>
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <Button variant="outline" className="w-full justify-center text-xs font-mono uppercase dt-button rounded-sm border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white">Sign_In</Button>
            <Button className="w-full justify-center bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono uppercase dt-button rounded-sm">
              Join_Waitlist
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function BuilderGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = canvas.offsetWidth || 440;
    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth || 440;
    };
    window.addEventListener("resize", onResize);

    // Focus the globe on Italy (~lat 42, lng 12.5) and zoom in via scale.
    const focusLng = 12.5;
    const focusLat = 42;
    const basePhi = Math.PI - ((focusLng * Math.PI) / 180 - Math.PI / 2);
    const theta = (focusLat * Math.PI) / 180;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: basePhi,
      theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 18000,
      mapBrightness: 9,
      mapBaseBrightness: 0.06,
      baseColor: [0.2, 0.23, 0.3],
      markerColor: [0.35, 0.62, 1],
      glowColor: [0.22, 0.3, 0.5],
      scale: 1.8,
      offset: [0, 0],
      context: { preserveDrawingBuffer: true },
      markers: Object.values(CITY_COORDS).map((location) => ({ location, size: 0.08 })),
    });

    // Gentle drift that keeps Italy centered while the surface subtly rotates.
    let drift = 0;
    let raf = 0;
    const tick = () => {
      drift += 0.004;
      globe.update({
        phi: basePhi + Math.sin(drift) * 0.16,
        theta,
        width: width * dpr,
        height: width * dpr,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", aspectRatio: "1" }}
    />
  );
}

function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % BUILDERS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const current = BUILDERS[active];

  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 border-b border-zinc-800 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 dt-grid-bg opacity-[0.6] pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-50 mb-6 leading-[1.1] tracking-tight">
              Build in public.<br />
              <span className="text-blue-500">Execute with precision.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              A highly-curated directory and platform for Italian technical founders, makers, and open-source contributors shipping production-ready products.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase text-xs dt-button rounded-sm w-full sm:w-auto">
                <Command size={16} className="mr-2" /> Init_Waitlist
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex -space-x-1">
                <img src="/__mockup/images/avatar-1.png" className="w-6 h-6 border border-zinc-700" alt="Builder" />
                <img src="/__mockup/images/avatar-2.png" className="w-6 h-6 border border-zinc-700" alt="Builder" />
                <img src="/__mockup/images/avatar-3.png" className="w-6 h-6 border border-zinc-700" alt="Builder" />
              </div>
              <div className="h-4 w-px bg-zinc-700" />
              <p><span className="font-bold text-zinc-100">500+</span> builders mapped across Italy</p>
            </div>
          </div>

          <div className="flex-1 w-full lg:max-w-lg">
            <div className="dt-card p-3 relative overflow-hidden">
              <div className="absolute inset-0 dt-grid-bg opacity-40 pointer-events-none" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{">"} geo.builders --map</span>
                <span className="text-[10px] font-mono text-blue-400 uppercase flex items-center gap-1">
                  <MapPin size={10} /> Italia
                </span>
              </div>

              <div className="relative aspect-square w-full max-w-[440px] mx-auto">
                <BuilderGlobe />

                {/* Cycling builder readout — each pin on the globe is a community builder */}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <div className="dt-card bg-zinc-950/80 backdrop-blur-sm p-2.5 flex items-center gap-3">
                    <img src={current.avatar} alt={current.name} className="w-8 h-8 object-cover border border-zinc-700 grayscale" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-xs font-bold text-zinc-100 truncate">{current.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">
                        {current.role} · {current.location}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                      {String(active + 1).padStart(2, "0")}/{BUILDERS.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px mt-3 dt-border bg-zinc-800 relative z-10">
                {[
                  { label: "Builders", value: "500+" },
                  { label: "Regions", value: "20" },
                  { label: "Cities", value: "60+" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-950 px-3 py-2.5 text-center">
                    <div className="text-sm font-bold text-zinc-100">{stat.value}</div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedBuilders() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const offset = dayOfYear % BUILDERS.length;
  const todaysBuilders = [...BUILDERS.slice(offset), ...BUILDERS.slice(0, offset)];

  const formattedDate = now.toISOString().split('T')[0];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section id="builders" className="py-20 bg-zinc-950 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
              {">"} QUERY: ACTIVE_BUILDERS --date={formattedDate}
            </div>
            <h2 className="text-3xl font-bold text-zinc-50 mb-2">Builder Highlights</h2>
            <p className="text-sm text-zinc-500 font-mono">Rotating dataset of verified operators.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors rounded-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors rounded-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto dt-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
          >
            {todaysBuilders.map((builder, i) => (
              <div
                key={`${builder.name}-${i}`}
                className="snap-start flex-shrink-0 w-80 dt-card p-5 flex flex-col group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={builder.avatar}
                      alt={builder.name}
                      className="w-10 h-10 object-cover border border-zinc-700 grayscale"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">{builder.name}</h3>
                      <div className="text-xs font-mono text-zinc-500">
                        {builder.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase">
                    <MapPin size={10} /> {builder.location}
                  </div>
                </div>

                <div className="text-sm text-zinc-300 leading-relaxed mb-4 flex-grow border-l-2 border-zinc-700 pl-3">
                  "{builder.highlight}"
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                  {builder.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-[10px] font-mono font-medium text-zinc-400 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-8 rounded-sm border border-zinc-800 text-xs font-mono uppercase bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400"
                >
                  View_Profile
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BuilderProjects() {
  const categories = ["All", ...Array.from(new Set(BUILDER_PROJECTS.map((p) => p.category)))];
  const [active, setActive] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = active === "All" ? BUILDER_PROJECTS : BUILDER_PROJECTS.filter((p) => p.category === active);
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const hasMore = filtered.length > visible.length;

  return (
    <section id="projects" className="py-20 bg-zinc-900/40 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {">"} SELECT * FROM projects LIMIT {showAll ? 'ALL' : '6'}
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-2">Deployed Artifacts</h2>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto dt-scrollbar pb-3 mb-6 md:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`px-3 py-1 text-xs font-mono uppercase border transition-colors flex-shrink-0 ${
                active === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((project, i) => (
            <div key={`${project.name}-${i}`} className="group dt-card flex flex-col">
              <div className="aspect-[16/9] w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                 <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border ${project.statusColor} backdrop-blur-sm`}>
                      {project.status}
                    </span>
                 </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-zinc-100 leading-none">{project.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900">{project.category}</span>
                </div>

                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{project.description}</p>

                <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={project.avatar} alt={project.builder} className="w-5 h-5 rounded-full border border-zinc-700 grayscale" />
                    <span className="text-xs font-mono text-zinc-300">{project.builder}</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center border-t border-zinc-800 pt-10">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="h-10 px-6 border-zinc-800 text-zinc-300 text-xs font-mono uppercase bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-100 rounded-sm"
            >
              Load_More_Records <ChevronUp className="ml-2 rotate-180" size={14} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function CommunityProjects() {
  return (
    <section id="os-projects" className="py-20 bg-zinc-950 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {">"} GIT_CLONE --RECURSIVE
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-3">Community OS Projects</h2>
          <p className="text-sm text-zinc-500 font-mono">Shared infrastructure built collaboratively.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {OS_PROJECTS.map((project, i) => {
            const Icon = project.icon;
            return (
              <div key={i} className="dt-card p-5 group flex flex-col hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center ${project.color} group-hover:border-blue-500/40 transition-colors`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-mono border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-500 uppercase">
                    {project.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-zinc-100 mb-2">{project.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 flex-grow">{project.description}</p>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-4 border-t border-zinc-800">
                  <span className="uppercase">{project.category}</span>
                  <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
                    VIEW_REPO <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Join() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="join" className="py-24 bg-zinc-900 text-zinc-300 border-t-4 border-blue-600">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12">

          <div>
            <div className="text-xs font-mono text-blue-400 mb-4 font-semibold tracking-wider uppercase">
              {">"} SYSTEM_REQUIREMENTS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Network Access Protocol
            </h2>
            <p className="text-sm text-zinc-400 mb-10 font-mono">
              The community operates on a strict verification model to maintain high signal-to-noise ratio.
            </p>

            <div className="space-y-6">
              {WHO_FOR.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-zinc-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 p-6 sm:p-8 rounded-sm dt-card relative overflow-hidden">
            {/* Terminal styling decorative top */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-zinc-900 border-b border-zinc-700 flex items-center px-3 gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
               <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
               <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
               <span className="ml-2 text-[10px] font-mono text-zinc-500">bash - waitlist</span>
            </div>

            <div className="mt-4">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12 h-full">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center mb-6">
                    <CheckCircle2 size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Request Processed</h3>
                  <p className="text-sm text-zinc-400 font-mono mb-8 max-w-xs">
                    Your credentials have been submitted for review.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="h-8 text-xs font-mono bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-sm"
                  >
                    Submit_Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">Init Connection</h3>
                    <p className="text-xs text-zinc-400 font-mono">Fill schema to request access.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-mono text-zinc-400">auth.name <span className="text-blue-400">*</span></Label>
                      <Input
                        id="name"
                        required
                        placeholder="John Doe"
                        className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-mono text-zinc-400">auth.email <span className="text-blue-400">*</span></Label>
                      <Input
                        id="email"
                        required
                        type="email"
                        placeholder="user@domain.com"
                        className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="role" className="text-xs font-mono text-zinc-400">auth.role <span className="text-blue-400">*</span></Label>
                      <Select required defaultValue={ROLES[0]}>
                        <SelectTrigger id="role" className="bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm font-mono focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100 rounded-sm">
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role} className="focus:bg-zinc-700 focus:text-white font-mono text-xs">{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="building" className="text-xs font-mono text-zinc-400">meta.building <span className="text-zinc-600">// optional</span></Label>
                      <Input
                        id="building"
                        placeholder="A short description, or 'looking for ideas'"
                        className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="twitter" className="text-xs font-mono text-zinc-400">links.x_handle</Label>
                        <div className="relative">
                          <Twitter size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                          <Input id="twitter" placeholder="@username" className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm font-mono" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="linkedin" className="text-xs font-mono text-zinc-400">links.linkedin</Label>
                        <div className="relative">
                          <Linkedin size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                          <Input id="linkedin" placeholder="in/username" className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="website" className="text-xs font-mono text-zinc-400">links.personal_url</Label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                        <Input id="website" type="url" placeholder="https://..." className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm font-mono" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="project" className="text-xs font-mono text-zinc-400">links.project_url</Label>
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                        <Input id="project" type="url" placeholder="https://..." className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm font-mono" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white h-10 rounded-sm font-mono text-xs uppercase dt-button shadow-none">
                    Execute_Submit
                  </Button>
                  <p className="text-[10px] text-center text-zinc-500 font-mono mt-3">
                    ALL SUBMISSIONS LOGGED SECURELY.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-12 pb-8 text-zinc-400">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 font-mono text-xs">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="w-5 h-5 bg-white text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                IT
              </div>
              <span className="font-semibold uppercase tracking-wider">ITALIAN_BUILDERS</span>
            </div>
            <p className="text-zinc-500 mb-6 max-w-xs leading-relaxed">
              A private network and discovery protocol for the Italian maker ecosystem.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#builders" className="hover:text-white transition-colors">Directory</a></li>
              <li><a href="#projects" className="hover:text-white transition-colors">Showcase</a></li>
              <li><a href="#os-projects" className="hover:text-white transition-colors">Open_Source</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">System</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Privacy_Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms_Of_Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact_Admin</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px]">
          <p className="text-zinc-600">© {new Date().getFullYear()} ITALIAN BUILDERS. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export function DarkTechnical() {
  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedBuilders />
        <BuilderProjects />
        <CommunityProjects />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
