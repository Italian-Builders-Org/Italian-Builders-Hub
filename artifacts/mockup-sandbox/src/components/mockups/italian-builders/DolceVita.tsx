import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Menu, X, ArrowRight, Pizza, Coffee, Wine,
  MapPin, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp,
  Globe, Rocket, Heart, Send, Handshake, Sprout, Telescope, Hammer, LayoutGrid, Compass
} from "lucide-react";
import "./DolceVita.css";

// --- Mock Data ---

const OS_PROJECTS = [
  {
    title: "Italian Builders Directory",
    description: "An open directory to discover active builders, products, and startups in the ecosystem.",
    status: "Coming soon",
    category: "Directory",
    icon: Compass,
    gradient: "from-emerald-500 to-green-600"
  },
  {
    title: "Builder Profile Pages",
    description: "Public pages showcasing your projects, contributions, and builder journey.",
    status: "In discussion",
    category: "Profiles",
    icon: LayoutGrid,
    gradient: "from-amber-500 to-orange-500"
  },
  {
    title: "Project Showcase",
    description: "A centralized hub to launch, hunt, and vote on projects built by the community.",
    status: "Coming soon",
    category: "Showcase",
    icon: Rocket,
    gradient: "from-red-500 to-rose-600"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-800",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "bg-orange-100 text-orange-800",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "bg-blue-100 text-blue-800",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "bg-yellow-100 text-yellow-800",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-800",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "bg-orange-100 text-orange-800",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  },
  {
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "bg-orange-100 text-orange-800",
    image: "/__mockup/images/project-7.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "bg-blue-100 text-blue-800",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "DevKit",
    category: "DevTools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "bg-yellow-100 text-yellow-800",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  }
];

const ROADMAP_DATA = [
  { id: 1, title: "Builder profiles", description: "Public pages to showcase your work, stack, and current focus.", initialVotes: 142, status: "In progress" },
  { id: 2, title: "Project pages", description: "Dedicated spaces to launch products and gather feedback.", initialVotes: 118, status: "Planned" },
  { id: 3, title: "Category-based discovery", description: "Find peers by niche, from AI to Crypto.", initialVotes: 97, status: "Planned" },
  { id: 4, title: "Founder matching", description: "Get matched with co-founders who complement your skills.", initialVotes: 86, status: "Exploring" },
  { id: 5, title: "Video introductions", description: "Short asynchronous intros to build trust faster.", initialVotes: 64, status: "Exploring" },
  { id: 6, title: "Open-source projects", description: "Contribute to shared community infrastructure.", initialVotes: 53, status: "In progress" },
  { id: 7, title: "Resources and playbooks", description: "Curated knowledge from operators who have done it.", initialVotes: 48, status: "Planned" },
  { id: 8, title: "Member perks", description: "Software discounts to extend your runway.", initialVotes: 39, status: "Planned" }
];

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

const WHO_FOR = [
  {
    title: "Builders",
    description: "For people building apps, products, startups, and tools.",
    icon: Hammer
  },
  {
    title: "Contributors",
    description: "For developers, designers, marketers, and makers who want to collaborate.",
    icon: Handshake
  },
  {
    title: "Supporters",
    description: "For mentors, advisors, and people who want to help the ecosystem grow.",
    icon: Sprout
  },
  {
    title: "Investors",
    description: "For people looking for early projects and emerging talent.",
    icon: Telescope
  }
];

// --- Sub-components ---

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EADECD]">
      <div className="tricolore-bar">
        <div className="green"></div>
        <div className="white"></div>
        <div className="red"></div>
      </div>
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-italy-green flex items-center justify-center rotate-3 shadow-sm border border-[#005c2d]">
            <Pizza className="text-white w-6 h-6 -rotate-3" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-[#2C241B]">Italian Builders</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#builders" className="text-base font-medium text-[#5c4f3d] hover:text-italy-red transition-colors">La Famiglia</a>
          <a href="#projects" className="text-base font-medium text-[#5c4f3d] hover:text-italy-red transition-colors">Progetti</a>
          <a href="#os-projects" className="text-base font-medium text-[#5c4f3d] hover:text-italy-red transition-colors">Open Source</a>
          <a href="#roadmap" className="text-base font-medium text-[#5c4f3d] hover:text-italy-red transition-colors">Andiamo!</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#join" className="text-base font-medium text-[#5c4f3d] hover:text-[#2C241B]">Accedi</a>
          <button className="dolcevita-btn-red rounded-full px-6 py-2.5 font-medium flex items-center gap-2 text-base">
            Unisciti <ArrowRight size={18} />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-[#2C241B]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EADECD] bg-[#FDFBF7] px-4 py-6 space-y-4 shadow-xl absolute w-full">
          <nav className="flex flex-col space-y-4">
            <a href="#builders" className="text-lg font-medium text-[#5c4f3d]" onClick={() => setMobileMenuOpen(false)}>La Famiglia (Builders)</a>
            <a href="#projects" className="text-lg font-medium text-[#5c4f3d]" onClick={() => setMobileMenuOpen(false)}>Progetti (Projects)</a>
            <a href="#os-projects" className="text-lg font-medium text-[#5c4f3d]" onClick={() => setMobileMenuOpen(false)}>Open Source</a>
            <a href="#roadmap" className="text-lg font-medium text-[#5c4f3d]" onClick={() => setMobileMenuOpen(false)}>Andiamo! (Roadmap)</a>
          </nav>
          <div className="pt-6 border-t border-[#EADECD] flex flex-col gap-3">
            <button className="dolcevita-btn-outline rounded-xl py-3 font-medium text-lg w-full">Accedi (Sign in)</button>
            <button className="dolcevita-btn-red rounded-xl py-3 font-medium text-lg w-full">Unisciti (Join)</button>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 trattoria-pattern">
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-5xl">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#EADECD] text-[#8f5e27] font-semibold text-sm mb-8 shadow-sm rotate-[-2deg]">
          <Coffee size={16} className="text-[#8f5e27]" />
          <span>Ciao, builders! The home for Italian makers.</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold font-display text-[#2C241B] mb-6 leading-[1.05] tracking-tight">
          La Dolce Vita. <br className="hidden md:block" />
          <span className="text-italy-red italic">Build in public</span> con stile.
        </h1>
        
        <p className="text-xl md:text-2xl text-[#5c4f3d] mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          Mangia, codifica, dormi. A community for people building apps, AI tools, SaaS products, and internet businesses from Italy.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
          <button className="dolcevita-btn-green w-full sm:w-auto h-14 px-10 rounded-full text-lg font-bold flex items-center justify-center gap-2">
            Andiamo! (Join waitlist) <Rocket size={20} />
          </button>
          <button className="dolcevita-btn-outline w-full sm:w-auto h-14 px-10 rounded-full text-lg font-bold flex items-center justify-center gap-2">
            Esplora <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-2xl rotate-[1deg] bg-[#EADECD]">
          <div className="aspect-[16/9] w-full bg-[#EADECD] relative">
            <img 
              src="/__mockup/images/dolcevita-hero.png" 
              alt="Italian piazza with a vintage Vespa and laptop" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1516483638261-f40af5a5ae6a?q=80&w=2000&auto=format&fit=crop";
              }}
            />
          </div>
          {/* Stat strip overlaid on image */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-[#EADECD] flex items-center gap-4">
            <div className="flex -space-x-3">
              <img src="/__mockup/images/avatar-1.png" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Builder" />
              <img src="/__mockup/images/avatar-2.png" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Builder" />
              <img src="/__mockup/images/avatar-3.png" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Builder" />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-italy-red flex items-center justify-center text-sm font-bold text-white shadow-inner">+</div>
            </div>
            <p className="text-sm font-bold text-[#2C241B]">240+ builders joined in 48h</p>
          </div>
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
  const todayLabel = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });
  };

  return (
    <section id="builders" className="py-24 bg-[#FDFBF7] relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 text-sm font-bold text-italy-red bg-[#CD212A]/10 px-4 py-2 rounded-full border border-[#CD212A]/20">
              <Wine size={16} className="text-italy-red" />
              La Famiglia · {todayLabel}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-[#2C241B] mb-4">Builder highlights</h2>
            <p className="text-xl text-[#5c4f3d] font-medium">A rotating spotlight on the people building from Italy. Benvenuti a tutti.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-full dolcevita-btn-outline flex items-center justify-center text-[#2C241B]"
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-full dolcevita-btn-outline flex items-center justify-center text-[#2C241B]"
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-[#FDFBF7] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-[#FDFBF7] to-transparent z-20 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto dolcevita-scroll snap-x snap-mandatory scroll-smooth px-4 md:px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] py-4 pb-8"
        >
          {todaysBuilders.map((builder, i) => (
            <div
              key={`${builder.name}-${i}`}
              className="snap-start flex-shrink-0 w-80 dolcevita-card p-6 flex flex-col relative overflow-hidden group"
            >
              {/* Decorative corner accent */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFF8E7] rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <img
                  src={builder.avatar}
                  alt={builder.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#EADECD] shadow-sm bg-white"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${builder.name}&background=random`; }}
                />
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-xl text-[#2C241B] truncate leading-tight">{builder.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#8f5e27] font-medium mt-1">
                    <span className="truncate">{builder.role}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <MapPin size={12} /> {builder.location}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[#5c4f3d] text-base leading-relaxed mb-6 flex-grow relative z-10 italic">
                "{builder.highlight}"
              </p>

              <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                {builder.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-md dolcevita-badge-category text-xs font-bold uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button className="w-full justify-between mt-auto rounded-xl py-3 px-4 font-bold text-italy-red bg-[#CD212A]/5 hover:bg-[#CD212A]/10 border border-[#CD212A]/20 transition-colors flex items-center relative z-10">
                View profile
                <ArrowRight size={18} />
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
    <section id="projects" className="py-24 bg-white border-y border-[#EADECD]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mb-12 text-center mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-italy-green/10 text-italy-green mb-6">
            <Pizza size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-[#2C241B] mb-6">Fatto in Italia (Made in Italy)</h2>
          <p className="text-xl text-[#5c4f3d] font-medium">Apps, tools, experiments, startups, and side projects freshly baked by our community.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto dolcevita-scroll pb-4 mb-10 justify-center flex-nowrap md:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`px-6 py-2.5 rounded-full text-base font-bold transition-all flex-shrink-0 border-2 ${
                active === cat
                  ? "bg-italy-green text-white border-[#005c2d] shadow-[2px_2px_0px_#005c2d] translate-y-[-1px]"
                  : "bg-white text-[#5c4f3d] border-[#EADECD] hover:border-[#D5C1A6] hover:bg-[#FDFBF7]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((project, i) => (
            <div key={`${project.name}-${i}`} className="dolcevita-card flex flex-col overflow-hidden group">
              {/* Image Container */}
              <div className="aspect-[4/3] w-full bg-[#FDFBF7] relative overflow-hidden border-b-2 border-[#EADECD]">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${project.name}&background=random&size=400`; }} />
                 <div className="absolute top-4 left-4">
                    <span className="inline-block px-3 py-1.5 rounded-md bg-white/95 backdrop-blur border border-[#EADECD] text-[#2C241B] font-bold text-sm shadow-sm">
                      {project.category}
                    </span>
                 </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex flex-col flex-grow bg-white">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-display font-bold text-2xl text-[#2C241B] group-hover:text-italy-red transition-colors">{project.name}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                    project.status === "Live" ? "bg-green-50 text-green-700 border-green-200" :
                    project.status === "Beta" ? "bg-orange-50 text-orange-700 border-orange-200" :
                    project.status === "MVP" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="text-[#5c4f3d] text-base leading-relaxed mb-6 flex-grow">{project.description}</p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-[#EADECD]">
                  <img src={project.avatar} alt={project.builder} className="w-8 h-8 rounded-full border border-[#EADECD]" 
                       onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${project.builder}&background=random`; }}/>
                  <span className="text-sm font-bold text-[#8f5e27]">{project.builder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setShowAll(true)}
              className="dolcevita-btn-outline px-8 py-3 rounded-full text-lg font-bold inline-flex items-center justify-center gap-2"
            >
              Discover more projects <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function OpenSource() {
  return (
    <section id="os-projects" className="py-24 bg-[#2C241B] text-[#FDFBF7]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-6 text-sm font-bold text-[#F3E0B5] bg-[#FFF8E7]/10 px-4 py-2 rounded-full border border-[#F3E0B5]/20">
              <Globe size={16} />
              Open Source
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">Built for La Famiglia</h2>
            <p className="text-xl text-[#D5C1A6] font-medium leading-relaxed">
              We are building the core infrastructure of the community in public. Contribute, learn, and grow with us.
            </p>
          </div>
          <button className="dolcevita-btn-green px-8 py-3 rounded-xl text-lg font-bold shrink-0 shadow-none hover:shadow-none hover:translate-y-0">
            View GitHub
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OS_PROJECTS.map((project, i) => (
            <div key={i} className="bg-[#3D3327] border-2 border-[#5c4f3d] rounded-2xl p-8 hover:border-italy-green transition-colors group flex flex-col">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.gradient} flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:-rotate-3 transition-transform`}>
                <project.icon className="text-white w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold font-display text-white mb-3">{project.title}</h3>
              <p className="text-[#D5C1A6] mb-8 flex-grow text-lg leading-relaxed">{project.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-[#5c4f3d]">
                <span className="text-sm font-bold text-[#F3E0B5] uppercase tracking-wider">{project.status}</span>
                <button className="text-white hover:text-italy-green transition-colors">
                  <ArrowRight size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const [votes, setVotes] = useState<Record<number, number>>(
    ROADMAP_DATA.reduce((acc, item) => ({ ...acc, [item.id]: item.initialVotes }), {})
  );
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  const handleVote = (id: number) => {
    if (voted[id]) return;
    setVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
    setVoted(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section id="roadmap" className="py-24 bg-[#FDFBF7] trattoria-pattern">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-italy-red/10 text-italy-red mb-6">
            <Rocket size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-[#2C241B] mb-6">Andiamo! (Roadmap)</h2>
          <p className="text-xl text-[#5c4f3d] font-medium max-w-2xl mx-auto">
            Help us prioritize what to build next. The community decides what "La Dolce Vita" looks like.
          </p>
        </div>

        <div className="space-y-4">
          {ROADMAP_DATA.map((item, i) => (
            <div key={item.id} className="dolcevita-card p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-6">
              
              {/* Upvote Button */}
              <button 
                onClick={() => handleVote(item.id)}
                className={`shrink-0 flex flex-row md:flex-col items-center justify-center gap-2 md:gap-1 md:w-20 md:h-20 p-3 md:p-0 rounded-xl border-2 transition-all ${
                  voted[item.id] 
                    ? "bg-italy-green/10 border-italy-green text-italy-green" 
                    : "bg-white border-[#EADECD] text-[#8f5e27] hover:border-[#D5C1A6] hover:bg-[#FDFBF7]"
                }`}
              >
                <ChevronUp size={24} className={`stroke-[3px] ${voted[item.id] ? "text-italy-green" : ""}`} />
                <span className="font-bold text-lg">{votes[item.id]}</span>
              </button>
              
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold font-display text-[#2C241B]">{item.title}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                    item.status === "In progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    item.status === "Planned" ? "bg-gray-100 text-gray-700 border-gray-200" :
                    "bg-purple-50 text-purple-700 border-purple-200"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[#5c4f3d] text-base">{item.description}</p>
              </div>
            </div>
          ))}
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
    <section id="join" className="py-24 bg-white border-y border-[#EADECD]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-[#2C241B] mb-6">Benvenuti nella famiglia.</h2>
            <p className="text-xl text-[#5c4f3d] font-medium mb-12 leading-relaxed">
              Whether you are shipping your first MVP or scaling a profitable SaaS, there is a place for you at our table.
            </p>

            <div className="space-y-8">
              {WHO_FOR.map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#FFF8E7] border border-[#F3E0B5] flex items-center justify-center text-[#B5651D] rotate-3 shadow-sm">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2C241B] mb-2 font-display">{item.title}</h3>
                    <p className="text-[#5c4f3d] leading-relaxed text-base">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="dolcevita-card p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-italy-green via-white to-italy-red"></div>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-italy-green" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-[#2C241B] mb-4">Perfetto! You're on the list.</h3>
                  <p className="text-lg text-[#5c4f3d] mb-8">Grab an espresso. We'll be in touch soon.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="dolcevita-btn-outline px-6 py-2 rounded-full font-bold"
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-display font-bold text-[#2C241B] mb-2">Join the waitlist</h3>
                  <p className="text-[#5c4f3d] mb-8 text-lg">Leave your details and we'll invite you to our private community.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="dv-name" className="text-sm font-bold text-[#2C241B]">Name / Handle <span className="text-italy-red">*</span></label>
                      <input id="dv-name" required type="text" className="w-full dolcevita-input text-lg" placeholder="Mario Rossi" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="dv-x" className="text-sm font-bold text-[#2C241B]">X / Twitter</label>
                        <input id="dv-x" type="text" className="w-full dolcevita-input" placeholder="@username" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="dv-linkedin" className="text-sm font-bold text-[#2C241B]">LinkedIn</label>
                        <input id="dv-linkedin" type="text" className="w-full dolcevita-input" placeholder="linkedin.com/in/..." />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dv-website" className="text-sm font-bold text-[#2C241B]">Personal Website</label>
                      <input id="dv-website" type="url" className="w-full dolcevita-input" placeholder="https://" />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dv-project" className="text-sm font-bold text-[#2C241B]">Project / Startup URL</label>
                      <input id="dv-project" type="url" className="w-full dolcevita-input" placeholder="https://" />
                    </div>

                    <button type="submit" className="w-full dolcevita-btn-red text-lg font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2">
                      <Send size={20} /> Request access
                    </button>
                    <p className="text-center text-sm text-[#8f5e27] mt-4 italic">No spam, just amore.</p>
                  </form>
                </>
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
    <footer className="bg-[#2C241B] text-[#FDFBF7] py-16 border-t-[6px] border-italy-green relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-italy-red flex items-center justify-center -rotate-3 border border-[#8f171d]">
                <Pizza className="text-white w-6 h-6 rotate-3" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-white">Italian Builders</span>
            </div>
            <p className="text-[#D5C1A6] text-lg max-w-sm mb-6 leading-relaxed">
              The sweet life of building. Connect, collaborate, and launch with the best makers from Italy.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#3D3327] flex items-center justify-center hover:bg-italy-red transition-colors">
                <span className="font-bold">X</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#3D3327] flex items-center justify-center hover:bg-italy-green transition-colors">
                <span className="font-bold">in</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white text-lg mb-6 font-display">Community</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Builders</a></li>
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Projects</a></li>
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Open Source</a></li>
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Roadmap</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white text-lg mb-6 font-display">Resources</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Guidelines</a></li>
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Manifesto</a></li>
              <li><a href="#" className="text-[#D5C1A6] hover:text-white transition-colors">Sponsorships</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[#5c4f3d] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#D5C1A6] text-sm">
            © {new Date().getFullYear()} Italian Builders. Fatto in Italia.
          </p>
          <div className="flex items-center gap-2 text-[#D5C1A6] text-sm">
            <span>Built with</span>
            <Heart size={14} className="text-italy-red fill-italy-red" />
            <span>by the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page ---

export function DolceVita() {
  return (
    <div className="dolcevita-container min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedBuilders />
        <BuilderProjects />
        <OpenSource />
        <Roadmap />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
