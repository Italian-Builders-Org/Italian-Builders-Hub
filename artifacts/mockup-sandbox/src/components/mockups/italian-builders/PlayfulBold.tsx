import React, { useState, useRef } from "react";
import {
  Menu, X, ArrowRight, Twitter, Linkedin, Globe, Link as LinkIcon,
  CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, Plus, Zap, MapPin,
  Sparkles, Hammer, Handshake, Sprout, Telescope, Compass, LayoutGrid, Rocket, Smile
} from "lucide-react";
import "./PlayfulBold.css";

// --- Mock Data ---

const OS_PROJECTS = [
  {
    title: "Italian Builders Directory",
    description: "An open directory to discover active builders, products, and startups in the ecosystem.",
    status: "Coming soon",
    category: "Directory",
    icon: Compass,
    color: "bg-blue-300"
  },
  {
    title: "Builder Profile Pages",
    description: "Public pages showcasing your projects, contributions, and builder journey.",
    status: "In discussion",
    category: "Profiles",
    icon: LayoutGrid,
    color: "bg-pink-300"
  },
  {
    title: "Project Showcase",
    description: "A centralized hub to launch, hunt, and vote on projects built by the community.",
    status: "Coming soon",
    category: "Showcase",
    icon: Rocket,
    color: "bg-green-300"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "pb-badge-green",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "pb-badge-pink",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "pb-badge-blue",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "pb-badge-yellow",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "pb-badge-green",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "pb-badge-pink",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  },
  {
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "pb-badge-pink",
    image: "/__mockup/images/project-7.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "pb-badge-blue",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "DevKit",
    category: "DevTools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "pb-badge-yellow",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  }
];

const ROADMAP = [
  { id: 1, title: "Builder profiles", description: "Public pages to showcase your work, stack, and current focus.", votes: 142, status: "In progress" },
  { id: 2, title: "Project pages", description: "Dedicated spaces to launch products and gather feedback.", votes: 118, status: "Planned" },
  { id: 3, title: "Category-based discovery", description: "Find peers by niche, from AI to Crypto.", votes: 97, status: "Planned" },
  { id: 4, title: "Founder matching", description: "Get matched with co-founders who complement your skills.", votes: 86, status: "Exploring" },
  { id: 5, title: "Video introductions", description: "Short asynchronous intros to build trust faster.", votes: 64, status: "Exploring" },
  { id: 6, title: "Open-source projects", description: "Contribute to shared community infrastructure.", votes: 53, status: "In progress" },
  { id: 7, title: "Resources and playbooks", description: "Curated knowledge from operators who have done it.", votes: 48, status: "Planned" },
  { id: 8, title: "Member perks", description: "Software discounts to extend your runway.", votes: 39, status: "Planned" }
];

const WHO_FOR = [
  {
    title: "Builders",
    description: "For people building apps, products, startups, and tools.",
    icon: Hammer,
    color: "bg-yellow-300"
  },
  {
    title: "Contributors",
    description: "For developers, designers, marketers, and makers who want to collaborate.",
    icon: Handshake,
    color: "bg-blue-300"
  },
  {
    title: "Supporters",
    description: "For mentors, advisors, and people who want to help the ecosystem grow.",
    icon: Sprout,
    color: "bg-green-300"
  },
  {
    title: "Investors & Talent Scouts",
    description: "For people looking for early projects, promising builders, and emerging talent.",
    icon: Telescope,
    color: "bg-pink-300"
  }
];

const BUILDERS = [
  { name: "Marco Rossi", role: "Founder", location: "Milano", avatar: "/__mockup/images/avatar-1.png", highlight: "Bootstrapping Supersync to $12k MRR, solo.", tags: ["SaaS", "DevTools"], color: "bg-pink-100" },
  { name: "Sofia Bianchi", role: "AI Engineer", location: "Torino", avatar: "/__mockup/images/avatar-2.png", highlight: "Shipping generative UI tooling with Lumina AI.", tags: ["AI", "Design"], color: "bg-yellow-100" },
  { name: "Luca Ferrari", role: "Infra Developer", location: "Bologna", avatar: "/__mockup/images/avatar-3.png", highlight: "Building Postgres branching for preview envs.", tags: ["DevTools", "Open Source"], color: "bg-blue-100" },
  { name: "Giulia Romano", role: "Product Lead", location: "Roma", avatar: "/__mockup/images/avatar-4.png", highlight: "Designing a CRM for boutique agencies.", tags: ["B2B", "SaaS"], color: "bg-green-100" },
  { name: "Alessandro Conti", role: "Founder", location: "Napoli", avatar: "/__mockup/images/avatar-5.png", highlight: "Fiat-to-crypto rails for EU merchants.", tags: ["Crypto", "Fintech"], color: "bg-orange-100" },
  { name: "Elena Marino", role: "Creator", location: "Firenze", avatar: "/__mockup/images/avatar-6.png", highlight: "Open-source storefront for digital creators.", tags: ["Open Source", "E-commerce"], color: "bg-purple-100" },
  { name: "Davide Greco", role: "Indie Hacker", location: "Verona", avatar: "/__mockup/images/avatar-1.png", highlight: "Automating boring ops with no-code flows.", tags: ["Automation", "No-Code"], color: "bg-pink-100" },
  { name: "Chiara Esposito", role: "Designer & Dev", location: "Palermo", avatar: "/__mockup/images/avatar-2.png", highlight: "Crafting calm consumer apps for iOS.", tags: ["Consumer Apps", "Mobile"], color: "bg-blue-100" },
  { name: "Matteo Galli", role: "Solo Founder", location: "Genova", avatar: "/__mockup/images/avatar-3.png", highlight: "AI copilots for indie developers.", tags: ["AI", "DevTools"], color: "bg-yellow-100" },
  { name: "Francesca Lombardi", role: "Growth", location: "Padova", avatar: "/__mockup/images/avatar-4.png", highlight: "Scaling a B2C habit-tracking app to 50k users.", tags: ["B2C", "Mobile"], color: "bg-green-100" },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fffbf0] border-b-4 border-gray-900 pb-1">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-400 border-3 border-gray-900 shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center transform -rotate-6">
            <span className="text-gray-900 font-display font-black text-xl">IB</span>
          </div>
          <span className="font-display font-black text-2xl tracking-tight text-gray-900 uppercase">Italian Builders</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-bold text-lg">
          <a href="#builders" className="text-gray-900 hover:-translate-y-1 hover:text-pink-500 transition-transform">Builders!</a>
          <a href="#projects" className="text-gray-900 hover:-translate-y-1 hover:text-blue-500 transition-transform">Projects</a>
          <a href="#os-projects" className="text-gray-900 hover:-translate-y-1 hover:text-green-500 transition-transform">OS</a>
          <a href="#roadmap" className="text-gray-900 hover:-translate-y-1 hover:text-yellow-500 transition-transform">Roadmap</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#join" className="font-bold text-lg text-gray-900 hover:-translate-y-1 transition-transform">Sign in</a>
          <button className="pb-button px-6 py-3 text-lg">
            Join Waitlist! <Zap size={20} className="ml-2 fill-current" />
          </button>
        </div>

        <button 
          className="md:hidden p-2 text-gray-900 border-2 border-gray-900 rounded-lg bg-yellow-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} className="stroke-[3]" /> : <Menu size={24} className="stroke-[3]" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t-4 border-gray-900 bg-[#fffbf0] px-4 py-6 space-y-6">
          <nav className="flex flex-col space-y-4">
            <a href="#builders" className="text-xl font-bold text-gray-900 uppercase flex items-center"><ChevronRight/> Builders</a>
            <a href="#projects" className="text-xl font-bold text-gray-900 uppercase flex items-center"><ChevronRight/> Projects</a>
            <a href="#os-projects" className="text-xl font-bold text-gray-900 uppercase flex items-center"><ChevronRight/> OS Projects</a>
            <a href="#roadmap" className="text-xl font-bold text-gray-900 uppercase flex items-center"><ChevronRight/> Roadmap</a>
          </nav>
          <div className="pt-6 border-t-4 border-gray-900 flex flex-col gap-4">
            <button className="pb-button pb-button-secondary py-3 text-xl w-full">Sign in</button>
            <button className="pb-button py-3 text-xl w-full">
              Join Waitlist!
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroGrid() {
  return (
    <div className="absolute inset-0 -z-10 w-[120%] -left-[10%] h-[150%] pointer-events-none select-none overflow-hidden opacity-50">
      <div className="grid grid-cols-3 gap-6 transform rotate-[-8deg] scale-110 translate-y-[-50px]">
        <div className="flex flex-col gap-6 pb-marquee">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`c1-${i}`} className="pb-card h-48 w-64 p-4 flex flex-col justify-between bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-gray-900 bg-blue-200" />
                <div className="w-24 h-4 bg-gray-200 rounded-full border-2 border-gray-900" />
              </div>
              <div className="h-16 w-full bg-pink-100 border-2 border-gray-900 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 pb-marquee" style={{ animationDelay: '-12s', animationDuration: '30s' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`c2-${i}`} className="pb-card h-64 w-80 p-4 flex flex-col gap-4 bg-blue-50 transform rotate-2">
              <div className="h-24 w-full bg-green-200 border-2 border-gray-900 rounded-xl" />
              <div className="w-3/4 h-6 bg-gray-200 rounded-full border-2 border-gray-900" />
              <div className="w-1/2 h-6 bg-gray-200 rounded-full border-2 border-gray-900" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 pb-marquee" style={{ animationDelay: '-5s' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`c3-${i}`} className="pb-card h-40 w-64 p-4 flex flex-col justify-between bg-pink-50 transform -rotate-3">
              <div className="w-16 h-6 bg-yellow-300 border-2 border-gray-900 rounded-full" />
              <div className="w-full h-12 bg-blue-100 border-2 border-gray-900 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-48">
      <div className="pb-blob bg-pink-300 w-[500px] h-[500px] -top-[100px] -right-[100px]" />
      <div className="pb-blob bg-yellow-300 w-[600px] h-[600px] top-[20%] -left-[200px]" />
      <div className="pb-blob bg-blue-300 w-[400px] h-[400px] -bottom-[100px] right-[10%]" />
      
      <HeroGrid />
      <div className="absolute inset-0 bg-[#fffbf0]/80 z-0 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
        <div className="inline-block transform -rotate-2 mb-8">
          <span className="pb-badge pb-badge-yellow text-lg py-2 px-6">
            <Sparkles size={20} className="mr-2" /> The Home for Italian Builders!
          </span>
        </div>
        
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black font-display tracking-tighter text-gray-900 mb-8 leading-[0.9] uppercase">
          Build In <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 text-white bg-blue-500 px-6 py-2 border-4 border-gray-900 shadow-[6px_6px_0px_0px_#111827] transform -skew-x-6 inline-block">
              PUBLIC!
            </span>
          </span>
        </h1>
        
        <p className="text-2xl md:text-3xl text-gray-800 font-medium mb-12 max-w-3xl mx-auto leading-snug border-4 border-gray-900 bg-white p-6 rounded-2xl shadow-[8px_8px_0px_0px_#111827] transform rotate-1">
          A vibrant community for people building apps, AI tools, SaaS products, open-source projects, and internet businesses from Italy.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <button className="pb-button py-4 px-10 text-2xl w-full sm:w-auto transform hover:-translate-y-2">
            JOIN THE WAITLIST!
          </button>
          <button className="pb-button pb-button-secondary py-4 px-10 text-2xl w-full sm:w-auto">
            EXPLORE
          </button>
        </div>
        
        <div className="inline-flex items-center gap-4 bg-white border-3 border-gray-900 rounded-full px-6 py-3 shadow-[4px_4px_0px_0px_#111827] font-bold text-lg">
          <div className="flex -space-x-4">
            <img src="/__mockup/images/avatar-1.png" className="w-12 h-12 rounded-full border-3 border-gray-900 relative z-30" alt="Builder" />
            <img src="/__mockup/images/avatar-2.png" className="w-12 h-12 rounded-full border-3 border-gray-900 relative z-20" alt="Builder" />
            <img src="/__mockup/images/avatar-3.png" className="w-12 h-12 rounded-full border-3 border-gray-900 relative z-10" alt="Builder" />
            <div className="w-12 h-12 rounded-full border-3 border-gray-900 bg-pink-400 flex items-center justify-center text-gray-900 z-0">
              <Plus strokeWidth={4} size={20} />
            </div>
          </div>
          <span>240+ joined in 48h!</span>
        </div>
      </div>
    </section>
  );
}

function FeaturedBuilders() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const offset = dayOfYear % BUILDERS.length;
  const todaysBuilders = [...BUILDERS.slice(offset), ...BUILDERS.slice(0, offset)];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section id="builders" className="py-24 bg-pink-400 border-y-4 border-gray-900 relative overflow-hidden">
      <div className="absolute top-4 left-4 grid grid-cols-6 gap-4 opacity-20 pointer-events-none">
        {Array.from({length: 24}).map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-gray-900" />)}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <span className="pb-badge pb-badge-yellow mb-4 text-base transform -rotate-2">
              <Smile size={18} className="mr-2" /> Refreshed Daily!
            </span>
            <h2 className="text-5xl md:text-7xl font-black font-display text-gray-900 mb-6 uppercase tracking-tight" style={{ textShadow: '4px 4px 0px #fff' }}>
              BUILDER HIGHLIGHTS
            </h2>
            <p className="text-2xl font-bold text-gray-900 bg-white inline-block px-4 py-2 border-2 border-gray-900 shadow-[4px_4px_0px_0px_#111827] transform rotate-1">
              A rotating spotlight on the people building from Italy.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => scroll("left")}
              className="w-16 h-16 rounded-full border-4 border-gray-900 bg-yellow-300 shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] hover:bg-yellow-400 transition-all flex items-center justify-center active:translate-y-1 active:shadow-[2px_2px_0px_0px_#111827]"
            >
              <ChevronLeft size={32} className="stroke-[3]" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-16 h-16 rounded-full border-4 border-gray-900 bg-yellow-300 shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] hover:bg-yellow-400 transition-all flex items-center justify-center active:translate-y-1 active:shadow-[2px_2px_0px_0px_#111827]"
            >
              <ChevronRight size={32} className="stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-no-scrollbar snap-x snap-mandatory scroll-smooth px-4 md:px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] py-8"
        >
          {todaysBuilders.map((builder, i) => (
            <div
              key={`${builder.name}-${i}`}
              className={`snap-start flex-shrink-0 w-[340px] pb-card p-8 flex flex-col ${builder.color}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={builder.avatar}
                  alt={builder.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-900 bg-white"
                />
                <div className="min-w-0">
                  <h3 className="font-black font-display text-2xl text-gray-900 truncate">{builder.name}</h3>
                  <div className="flex flex-col gap-1 text-base font-bold text-gray-700 mt-1">
                    <span>{builder.role}</span>
                    <span className="flex items-center gap-1 bg-white border-2 border-gray-900 rounded-md px-2 py-0.5 w-max text-sm">
                      <MapPin size={14} /> {builder.location}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xl font-bold leading-tight mb-6 flex-grow">"{builder.highlight}"</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {builder.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white border-2 border-gray-900 rounded-full text-sm font-bold text-gray-900"
                  >
                    #{tag.toUpperCase()}
                  </span>
                ))}
              </div>

              <button className="pb-button pb-button-secondary w-full py-3 text-lg border-3">
                VIEW PROFILE <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          ))}
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
    <section id="projects" className="py-24 bg-blue-50 relative">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-yellow-300 rounded-full filter blur-[80px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-pink-300 rounded-full filter blur-[80px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mb-12 text-center mx-auto">
          <h2 className="text-5xl md:text-7xl font-black font-display text-gray-900 mb-6 uppercase tracking-tight">
            PROJECTS <br/> FROM THE <span className="bg-yellow-300 px-4 py-1 border-4 border-gray-900 transform inline-block rotate-2 shadow-[4px_4px_0px_0px_#111827]">COMMUNITY</span>
          </h2>
          <p className="text-2xl font-bold text-gray-700 mt-8">Apps, tools, experiments, startups, and side projects.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 overflow-x-auto pb-no-scrollbar pb-4 mb-12 md:flex-wrap justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`px-6 py-2 rounded-full border-3 text-lg font-bold transition-all flex-shrink-0 whitespace-nowrap ${
                active === cat
                  ? "bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0px_0px_#ec4899] transform -translate-y-1"
                  : "bg-white text-gray-900 border-gray-900 hover:shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((project, i) => (
            <div key={`${project.name}-${i}`} className="pb-card flex flex-col overflow-hidden group">
              {/* Image Container */}
              <div className="aspect-[4/3] w-full bg-gray-200 relative border-b-3 border-gray-900 overflow-hidden">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                 <div className="absolute top-4 left-4 transform -rotate-3">
                    <span className={`pb-badge border-2 text-sm px-3 py-1 shadow-[2px_2px_0px_0px_#111827]`}>
                      {project.category}
                    </span>
                 </div>
                 <div className="absolute top-4 right-4 transform rotate-3">
                    <span className={`pb-badge ${project.statusColor} border-2 text-xs px-2 shadow-[2px_2px_0px_0px_#111827]`}>
                      {project.status}
                    </span>
                 </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex flex-col flex-grow bg-white">
                <h3 className="font-black font-display text-3xl text-gray-900 mb-3 uppercase tracking-tight">{project.name}</h3>
                <p className="text-lg font-medium text-gray-700 mb-6 flex-grow leading-snug">{project.description}</p>
                
                <div className="flex items-center gap-3 pt-6 border-t-3 border-dashed border-gray-200 mt-auto">
                  <img src={project.avatar} alt={project.builder} className="w-12 h-12 rounded-full border-3 border-gray-900 bg-gray-100" />
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Built by</p>
                    <p className="font-bold text-lg text-gray-900">{project.builder}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setShowAll(true)}
              className="pb-button py-4 px-10 text-xl"
            >
              DISCOVER MORE PROJECTS!
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function OsProjects() {
  return (
    <section id="os-projects" className="py-24 bg-yellow-400 border-y-4 border-gray-900 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#111827 3px, transparent 3px)', backgroundSize: '30px 30px' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl bg-white p-8 border-4 border-gray-900 shadow-[8px_8px_0px_0px_#111827] transform -rotate-1 rounded-2xl">
            <h2 className="text-4xl md:text-6xl font-black font-display text-gray-900 mb-4 uppercase">
              Community <br/>OS Projects
            </h2>
            <p className="text-xl font-bold text-gray-700">Open-source infrastructure built for the community, by the community.</p>
          </div>
          <button className="pb-button pb-button-secondary py-3 px-8 text-xl transform rotate-2">
            Contribute <ArrowRight size={20} className="ml-2" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {OS_PROJECTS.map((project, i) => (
            <div key={i} className={`pb-card p-8 flex flex-col ${project.color} transform hover:-translate-y-2`}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_#111827] flex items-center justify-center transform -rotate-6">
                  <project.icon size={32} className="text-gray-900 stroke-[3]" />
                </div>
                <span className="pb-badge bg-white text-sm transform rotate-3">
                  {project.status}
                </span>
              </div>
              <h3 className="font-black font-display text-2xl text-gray-900 mb-4 uppercase">{project.title}</h3>
              <p className="text-lg font-bold text-gray-800 flex-grow">{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const [votes, setVotes] = useState<Record<number, boolean>>({});
  
  const handleVote = (id: number) => {
    setVotes(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section id="roadmap" className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <span className="pb-badge pb-badge-pink mb-6 text-lg transform rotate-2">
            <Rocket size={20} className="mr-2" /> What's Next?
          </span>
          <h2 className="text-5xl md:text-7xl font-black font-display text-gray-900 mb-6 uppercase tracking-tight">
            A ROADMAP SHAPED <br/>BY THE COMMUNITY
          </h2>
          <p className="text-2xl font-bold text-gray-600">Vote on what we should build next.</p>
        </div>

        <div className="space-y-6">
          {ROADMAP.map((item) => {
            const hasVoted = votes[item.id];
            const currentVotes = item.votes + (hasVoted ? 1 : 0);
            
            return (
              <div key={item.id} className="pb-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group">
                <div className="flex items-start gap-6 flex-grow">
                  <button 
                    onClick={() => handleVote(item.id)}
                    disabled={hasVoted}
                    className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl border-3 border-gray-900 transition-all ${
                      hasVoted 
                        ? "bg-green-300 shadow-[inset_2px_2px_0px_0px_#111827] transform translate-y-1" 
                        : "bg-white shadow-[4px_4px_0px_0px_#111827] hover:bg-yellow-100 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#111827]"
                    }`}
                  >
                    <ChevronUp size={28} className={`stroke-[4] mb-1 ${hasVoted ? 'text-gray-900' : 'text-gray-900'}`} />
                    <span className="font-black text-xl leading-none">{currentVotes}</span>
                  </button>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-black font-display text-2xl text-gray-900 uppercase">{item.title}</h3>
                      <span className="pb-badge text-xs bg-gray-100">{item.status}</span>
                    </div>
                    <p className="text-lg font-medium text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function JoinWaitlist() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="join" className="py-24 bg-gray-900 border-t-4 border-gray-900 relative overflow-hidden">
      {/* Decorative stars */}
      <Sparkles className="absolute top-20 left-20 text-yellow-400 opacity-50" size={64} />
      <Sparkles className="absolute bottom-20 right-20 text-pink-400 opacity-50" size={48} />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Who it's for */}
          <div>
            <h2 className="text-5xl md:text-7xl font-black font-display text-white mb-8 uppercase leading-[0.9]">
              WHO IS <br/><span className="text-yellow-400">THIS FOR?</span>
            </h2>
            <p className="text-2xl font-bold text-gray-300 mb-12 border-l-4 border-pink-500 pl-6">
              A private, highly curated space. We're looking for doers, not just talkers.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {WHO_FOR.map((item, i) => (
                <div key={i} className="bg-gray-800 border-3 border-gray-700 p-6 rounded-2xl flex flex-col">
                  <div className={`w-14 h-14 rounded-xl ${item.color} border-3 border-gray-900 flex items-center justify-center mb-6 transform -rotate-3`}>
                    <item.icon size={28} className="text-gray-900 stroke-[3]" />
                  </div>
                  <h3 className="font-black text-xl text-white mb-2 uppercase">{item.title}</h3>
                  <p className="text-gray-400 font-medium">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="pb-card bg-[#fffbf0] p-8 md:p-12 relative transform rotate-1">
            {/* Tape decorations */}
            <div className="absolute -top-4 -left-4 w-24 h-8 bg-pink-500/50 transform -rotate-12" />
            <div className="absolute -bottom-4 -right-4 w-32 h-8 bg-blue-500/50 transform rotate-6" />
            
            {!submitted ? (
              <>
                <div className="mb-10 text-center">
                  <h3 className="text-4xl font-black font-display text-gray-900 mb-4 uppercase">Apply to join!</h3>
                  <p className="text-xl font-bold text-gray-600 bg-yellow-100 inline-block px-4 py-1 border-2 border-gray-900 transform -rotate-1">
                    Fill the form. We review weekly.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-lg font-black text-gray-900 mb-2 uppercase">Name / Handle *</label>
                    <input 
                      id="name" 
                      required 
                      className="pb-input w-full p-4 text-lg font-medium" 
                      placeholder="e.g. Mario Rossi"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-lg font-black text-gray-900 mb-2 uppercase">Email *</label>
                    <input 
                      id="email" 
                      required 
                      type="email"
                      className="pb-input w-full p-4 text-lg font-medium" 
                      placeholder="mario@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-lg font-black text-gray-900 mb-2 uppercase">I am a... *</label>
                    <select 
                      id="role" 
                      required 
                      defaultValue=""
                      className="pb-input w-full p-4 text-lg font-medium"
                    >
                      <option value="" disabled>Pick your role!</option>
                      {["Builder", "Developer", "Designer", "Founder", "Investor", "Student", "Supporter", "Other"].map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="building" className="block text-lg font-black text-gray-900 mb-2 uppercase">What are you building? (Optional)</label>
                    <input 
                      id="building" 
                      className="pb-input w-full p-4 text-lg font-medium" 
                      placeholder="A short description, or 'looking for ideas'"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="twitter" className="block text-lg font-black text-gray-900 mb-2 uppercase flex items-center gap-2">
                      <Twitter size={20} /> X (Twitter)
                    </label>
                    <input 
                      id="twitter" 
                      className="pb-input w-full p-4 text-lg font-medium" 
                      placeholder="https://x.com/username"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="linkedin" className="block text-lg font-black text-gray-900 mb-2 uppercase flex items-center gap-2">
                      <Linkedin size={20} /> LinkedIn
                    </label>
                    <input 
                      id="linkedin" 
                      className="pb-input w-full p-4 text-lg font-medium" 
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="website" className="block text-lg font-black text-gray-900 mb-2 uppercase flex items-center gap-2">
                        <Globe size={20} /> Website
                      </label>
                      <input 
                        id="website" 
                        className="pb-input w-full p-4 text-lg font-medium" 
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label htmlFor="project" className="block text-lg font-black text-gray-900 mb-2 uppercase flex items-center gap-2">
                        <LinkIcon size={20} /> Project
                      </label>
                      <input 
                        id="project" 
                        className="pb-input w-full p-4 text-lg font-medium" 
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className="pb-button w-full py-5 text-2xl mt-4">
                    SUBMIT APPLICATION! <Zap size={24} className="ml-2 fill-current" />
                  </button>
                </form>
              </>
            ) : (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-green-300 rounded-full border-4 border-gray-900 flex items-center justify-center mb-8 transform -rotate-6 shadow-[4px_4px_0px_0px_#111827]">
                  <CheckCircle2 size={48} className="text-gray-900 stroke-[3]" />
                </div>
                <h3 className="text-4xl font-black font-display text-gray-900 mb-4 uppercase">You're on the list!</h3>
                <p className="text-xl font-bold text-gray-600 mb-8 max-w-sm">
                  We've received your application. Keep an eye on your inbox, we review new profiles weekly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="pb-button pb-button-secondary py-3 px-8 text-lg"
                >
                  Submit another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 py-16 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-400 border-2 border-gray-900 flex items-center justify-center transform rotate-6">
              <span className="text-gray-900 font-display font-black text-lg">IB</span>
            </div>
            <span className="font-display font-black text-2xl tracking-tight text-white uppercase">Italian Builders</span>
          </div>
          
          <div className="flex gap-6 text-gray-400 font-bold">
            <a href="#" className="hover:text-yellow-400 transition-colors uppercase">Guidelines</a>
            <a href="#" className="hover:text-pink-400 transition-colors uppercase">Manifesto</a>
            <a href="#" className="hover:text-blue-400 transition-colors uppercase">Contact</a>
          </div>
        </div>
        
        <div className="pt-8 border-t-2 border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 font-medium">© {new Date().getFullYear()} Italian Builders. Not a real company.</p>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-yellow-400 hover:text-gray-900 transition-colors border-2 border-transparent hover:border-gray-900">
              <Twitter size={24} />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-400 hover:text-gray-900 transition-colors border-2 border-transparent hover:border-gray-900">
              <Linkedin size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PlayfulBold() {
  return (
    <div className="pb-container">
      <Header />
      <main>
        <Hero />
        <FeaturedBuilders />
        <BuilderProjects />
        <OsProjects />
        <Roadmap />
        <JoinWaitlist />
      </main>
      <Footer />
    </div>
  );
}
