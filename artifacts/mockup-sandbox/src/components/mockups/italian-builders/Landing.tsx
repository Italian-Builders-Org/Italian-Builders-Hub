import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Menu, X, ArrowRight, Twitter, Linkedin, Globe, Link as LinkIcon,
  CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, Plus, Zap, MapPin,
  Sparkles, Hammer, Handshake, Sprout, Telescope, Compass, LayoutGrid, Rocket
} from "lucide-react";
import "./Landing.css";

// --- Mock Data ---

const OS_PROJECTS = [
  {
    title: "Italian Builders Directory",
    description: "An open directory to discover active builders, products, and startups in the ecosystem.",
    status: "Coming soon",
    category: "Directory",
    icon: Compass,
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    title: "Builder Profile Pages",
    description: "Public pages showcasing your projects, contributions, and builder journey.",
    status: "In discussion",
    category: "Profiles",
    icon: LayoutGrid,
    gradient: "from-orange-500 to-rose-500"
  },
  {
    title: "Project Showcase",
    description: "A centralized hub to launch, hunt, and vote on projects built by the community.",
    status: "Coming soon",
    category: "Showcase",
    icon: Rocket,
    gradient: "from-violet-500 to-fuchsia-500"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-700",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "bg-blue-100 text-blue-700",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "bg-yellow-100 text-yellow-700",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "bg-green-100 text-green-700",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  },
  {
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700",
    image: "/__mockup/images/project-7.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "bg-blue-100 text-blue-700",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "DevKit",
    category: "DevTools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "bg-yellow-100 text-yellow-700",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  }
];

const ROADMAP = [
  { title: "Builder profiles", description: "Public pages to showcase your work, stack, and current focus.", votes: 142, status: "In progress" },
  { title: "Project pages", description: "Dedicated spaces to launch products and gather feedback.", votes: 118, status: "Planned" },
  { title: "Category-based discovery", description: "Find peers by niche, from AI to Crypto.", votes: 97, status: "Planned" },
  { title: "Founder matching", description: "Get matched with co-founders who complement your skills.", votes: 86, status: "Exploring" },
  { title: "Video introductions", description: "Short asynchronous intros to build trust faster.", votes: 64, status: "Exploring" },
  { title: "Open-source projects", description: "Contribute to shared community infrastructure.", votes: 53, status: "In progress" },
  { title: "Resources and playbooks", description: "Curated knowledge from operators who have done it.", votes: 48, status: "Planned" },
  { title: "Member perks", description: "Software discounts to extend your runway.", votes: 39, status: "Planned" }
];

const ROADMAP_STATUS_COLORS: Record<string, string> = {
  "In progress": "bg-blue-100 text-blue-700",
  "Planned": "bg-gray-100 text-gray-600",
  "Exploring": "bg-purple-100 text-purple-700"
};

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
    title: "Investors & Talent Scouts",
    description: "For people looking for early projects, promising builders, and emerging talent.",
    icon: Telescope
  }
];

const ROLES = [
  "Builder", "Developer", "Designer", "Founder", "Investor", "Student", "Supporter", "Other"
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

// --- Components ---

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">IB</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Italian Builders</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#builders" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Builders</a>
          <a href="#projects" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Projects</a>
          <a href="#os-projects" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">OS Projects</a>
          <a href="#roadmap" className="text-sm font-medium text-gray-600 hover:text-zinc-900 transition-colors">Roadmap</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#join" className="text-sm font-medium text-gray-600 hover:text-zinc-900">Sign in</a>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6">
            Join waitlist
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-zinc-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            <a href="#builders" className="text-base font-medium text-gray-600">Builders</a>
            <a href="#projects" className="text-base font-medium text-gray-600">Projects</a>
            <a href="#os-projects" className="text-base font-medium text-gray-600">OS Projects</a>
            <a href="#roadmap" className="text-base font-medium text-gray-600">Roadmap</a>
          </nav>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <Button variant="outline" className="w-full justify-center">Sign in</Button>
            <Button className="w-full justify-center bg-zinc-900 text-white hover:bg-zinc-800">
              Join waitlist
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroGrid() {
  return (
    <div className="hero-grid absolute inset-0 -z-10 w-[120%] -left-[10%] h-[150%] pointer-events-none select-none overflow-hidden">
      {/* Column 1 */}
      <div className="hero-grid-column animate-marquee">
        {[1, 2, 3, 4].map((i) => (
          <div key={`c1-${i}`} className="glass-card rounded-2xl p-4 flex flex-col gap-3 h-48 w-64">
             <div className="flex gap-3 items-center">
               <div className="w-10 h-10 rounded-full bg-gray-200" />
               <div className="space-y-1">
                 <div className="h-3 w-24 bg-gray-200 rounded-full" />
                 <div className="h-2 w-16 bg-gray-100 rounded-full" />
               </div>
             </div>
             <div className="h-20 bg-gray-100 rounded-xl w-full mt-2" />
          </div>
        ))}
      </div>
      
      {/* Column 2 */}
      <div className="hero-grid-column animate-marquee" style={{ animationDelay: '-15s', animationDuration: '40s' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={`c2-${i}`} className="glass-card rounded-2xl p-4 flex flex-col justify-between h-56 w-72">
             <div className="h-24 bg-gray-100 rounded-xl w-full" />
             <div className="space-y-2 mt-4">
                 <div className="h-3 w-32 bg-gray-200 rounded-full" />
                 <div className="h-2 w-full bg-gray-100 rounded-full" />
                 <div className="h-2 w-4/5 bg-gray-100 rounded-full" />
             </div>
          </div>
        ))}
      </div>

      {/* Column 3 */}
      <div className="hero-grid-column animate-marquee" style={{ animationDelay: '-5s' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={`c3-${i}`} className="glass-card rounded-2xl p-4 flex flex-col gap-3 h-40 w-64">
             <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-gray-100 text-transparent">Badge</Badge>
                <div className="w-6 h-6 rounded-full bg-gray-100" />
             </div>
             <div className="space-y-2 mt-auto">
                 <div className="h-4 w-28 bg-gray-200 rounded-full" />
                 <div className="h-2 w-full bg-gray-100 rounded-full" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
      <HeroGrid />
      
      {/* Gradient overlay to fade edges of the grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        <Badge variant="outline" className="mb-6 py-1.5 px-4 bg-white/50 backdrop-blur-sm border-gray-200 text-zinc-600 font-medium">
          <Zap size={14} className="mr-2 text-yellow-500 fill-yellow-500" />
          The home for Italian builders.
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-zinc-900 mb-6 leading-[1.1]">
          Where Italian builders <br className="hidden md:block" /> come to <span className="gradient-text">build in public.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          A community for people building apps, AI tools, SaaS products, open-source projects, and internet businesses from Italy.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-lg shadow-xl shadow-zinc-200">
            Join the waitlist
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full border-gray-300 text-zinc-700 hover:bg-gray-50 text-lg bg-white/80 backdrop-blur-sm">
            Explore what's coming
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-sm text-zinc-500 font-medium">
          <div className="flex -space-x-2">
            <img src="/__mockup/images/avatar-1.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <img src="/__mockup/images/avatar-2.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <img src="/__mockup/images/avatar-3.png" className="w-8 h-8 rounded-full border-2 border-white" alt="Builder" />
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">+</div>
          </div>
          <p>240+ builders joined in the first 48 hours.</p>
        </div>
      </div>
    </section>
  );
}

function FeaturedBuilders() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rotate the featured selection every day based on the day of the year.
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const offset = dayOfYear % BUILDERS.length;
  const todaysBuilders = [...BUILDERS.slice(offset), ...BUILDERS.slice(0, offset)];
  const todayLabel = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  return (
    <section id="builders" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
              <Sparkles size={14} className="text-yellow-500 fill-yellow-500" />
              Refreshed daily · {todayLabel}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Builder highlights</h2>
            <p className="text-lg text-zinc-600">A rotating spotlight on the people building from Italy. New faces every day.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-4 md:px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] py-2"
        >
          {todaysBuilders.map((builder, i) => (
            <div
              key={`${builder.name}-${i}`}
              className="snap-start flex-shrink-0 w-72 group rounded-3xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={builder.avatar}
                  alt={builder.name}
                  className="w-14 h-14 rounded-full object-cover bg-gray-100 ring-2 ring-white shadow-sm"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-zinc-900 truncate">{builder.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <span className="truncate">{builder.role}</span>
                    <span className="text-zinc-300">·</span>
                    <span className="inline-flex items-center gap-0.5 shrink-0">
                      <MapPin size={12} /> {builder.location}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-zinc-600 text-sm leading-relaxed mb-5 flex-grow">{builder.highlight}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {builder.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full justify-between mt-auto rounded-xl border border-gray-200 hover:bg-gray-50 text-zinc-700 font-medium group/btn"
              >
                View profile
                <ArrowRight size={16} className="text-zinc-400 group-hover/btn:text-zinc-700 group-hover/btn:translate-x-0.5 transition-all" />
              </Button>
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
    <section id="projects" className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Projects from the community</h2>
          <p className="text-lg text-zinc-600">Apps, tools, experiments, startups, and side projects from Italian builders.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-8 md:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex-shrink-0 ${
                active === cat
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((project, i) => (
            <div key={`${project.name}-${i}`} className="group rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all bg-white flex flex-col">
              {/* Image Container */}
              <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-sm text-zinc-800 hover:bg-white border-none shadow-sm font-semibold">
                      {project.category}
                    </Badge>
                 </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-zinc-900">{project.name}</h3>
                  <Badge variant="outline" className={`${project.statusColor} border-transparent font-semibold`}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-zinc-600 text-sm mb-6 flex-grow line-clamp-2">{project.description}</p>
                
                {/* Builder Row */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src={project.avatar} alt={project.builder} className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="text-sm font-medium text-zinc-700">{project.builder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discover more */}
        {hasMore && (
          <div className="flex justify-center mt-12">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="rounded-full h-12 px-8 border-gray-300 text-zinc-700 hover:bg-white bg-white/60 font-medium group"
            >
              Discover more projects
              <ArrowRight size={16} className="ml-2 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function OSProjects() {
  return (
    <section id="os-projects" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4">Community OS projects</h2>
            <p className="text-lg text-zinc-600">Open projects built by and for the Italian Builders community.</p>
          </div>
          <a href="#roadmap" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1.5 group">
            See the full roadmap
            <ArrowRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OS_PROJECTS.slice(0, 3).map((project, i) => {
            const Icon = project.icon;
            return (
              <div key={i} className="group rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all bg-white flex flex-col">
                {/* Gradient media block */}
                <div className={`aspect-[16/9] w-full bg-gradient-to-br ${project.gradient} relative flex items-center justify-center`}>
                  <Icon className="w-12 h-12 text-white/90" strokeWidth={1.5} />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-sm text-zinc-800 hover:bg-white border-none shadow-sm font-semibold">
                      {project.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 border-none font-medium">
                      {project.status}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-xl text-zinc-900 mb-2">{project.title}</h3>
                  <p className="text-zinc-600 text-sm flex-grow">{project.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const [votes, setVotes] = useState<number[]>(() => ROADMAP.map((r) => r.votes));
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  const toggleVote = (i: number) => {
    setVotes((prev) => prev.map((n, idx) => (idx === i ? (voted[i] ? n - 1 : n + 1) : n)));
    setVoted((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <section id="roadmap" className="py-24 bg-zinc-50 border-y border-gray-100">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <Badge className="bg-zinc-900 hover:bg-zinc-800 text-white mb-6 border-none">Open backlog</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-zinc-900 mb-4 leading-tight">A roadmap shaped by the community.</h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Telegram is where the conversation happens. This is where we decide what gets built next. Upvote what matters most to you.
            </p>
          </div>
          <Button variant="outline" className="rounded-full h-12 px-6 border-gray-300 text-zinc-700 hover:bg-white bg-white font-medium shrink-0">
            <Plus size={16} className="mr-2" />
            Suggest a feature
          </Button>
        </div>

        <div className="space-y-3">
          {ROADMAP.map((item, i) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => toggleVote(i)}
                aria-pressed={!!voted[i]}
                aria-label={`Upvote ${item.title}`}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-all shrink-0 ${
                  voted[i]
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-gray-200 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                <ChevronUp size={16} />
                <span className="text-sm font-bold leading-none mt-0.5">{votes[i]}</span>
              </button>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                  <Badge variant="outline" className={`border-transparent font-medium ${ROADMAP_STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialInput({
  icon: Icon,
  placeholder,
  value,
  onChange
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input
        placeholder={placeholder}
        className="h-12 pl-10 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function JoinSection() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formData, setFormData] = useState({
    name: "", email: "", role: "", building: "",
    x: "", linkedin: "", website: "", projectUrl: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    // Mock API call
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <section id="join" className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Who is it for */}
          <div>
            <Badge variant="outline" className="mb-6 py-1.5 px-4 bg-gray-50 border-gray-200 text-zinc-600 font-medium">
              Who is it for?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-zinc-900 mb-4 leading-tight">
              Built for everyone moving the ecosystem forward.
            </h2>
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              Whether you ship code, back founders, or cheer from the sidelines, there is a place for you here.
            </p>

            <div className="space-y-3">
              {WHO_FOR.map((persona) => {
                const Icon = persona.icon;
                return (
                  <div key={persona.title} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-zinc-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 mb-0.5">{persona.title}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">{persona.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Waitlist form */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 md:p-10">
              {status === "success" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold font-display text-zinc-900 mb-4">You're on the list.</h3>
                  <p className="text-lg text-zinc-600">We'll keep you posted. In the meantime, join the conversation on Telegram.</p>
                  <Button className="mt-8 rounded-full px-8 bg-[#0088cc] hover:bg-[#0077b5] text-white">
                    Join Telegram
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold font-display text-zinc-900 mb-2">Join the waitlist</h3>
                    <p className="text-zinc-600">Tell us who you are and what you're building. Links are optional.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-900">Name</label>
                        <Input 
                          required 
                          placeholder="Mario Rossi" 
                          className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-900">Email</label>
                        <Input 
                          required 
                          type="email" 
                          placeholder="mario@example.com" 
                          className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-900">I am a...</label>
                      <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-900">What are you building? <span className="text-zinc-400 font-normal">(Optional)</span></label>
                      <Input 
                        placeholder="A short description, or 'looking for ideas'" 
                        className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-zinc-900 rounded-xl"
                        value={formData.building}
                        onChange={e => setFormData({...formData, building: e.target.value})}
                      />
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px bg-gray-100 flex-grow" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Show your work (optional)</span>
                        <div className="h-px bg-gray-100 flex-grow" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SocialInput icon={Twitter} placeholder="X / Twitter profile" value={formData.x} onChange={(v) => setFormData({ ...formData, x: v })} />
                        <SocialInput icon={Linkedin} placeholder="LinkedIn profile" value={formData.linkedin} onChange={(v) => setFormData({ ...formData, linkedin: v })} />
                        <SocialInput icon={Globe} placeholder="Personal website" value={formData.website} onChange={(v) => setFormData({ ...formData, website: v })} />
                        <SocialInput icon={LinkIcon} placeholder="Project website" value={formData.projectUrl} onChange={(v) => setFormData({ ...formData, projectUrl: v })} />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={status === "submitting"}
                      className="w-full h-14 text-lg rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white mt-2"
                    >
                      {status === "submitting" ? "Joining..." : "Join the waitlist"}
                    </Button>
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
    <footer className="bg-white py-12 border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">IB</span>
            </div>
            <div>
              <span className="font-display font-semibold text-lg tracking-tight block leading-none">Italian Builders</span>
              <span className="text-sm text-zinc-500 mt-1 block">A community for people building from Italy.</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">Telegram</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">X/Twitter</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">GitHub</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export function Landing() {
  return (
    <div className="landing-container min-h-screen selection:bg-zinc-200">
      <Header />
      <main>
        <Hero />
        <FeaturedBuilders />
        <BuilderProjects />
        <OSProjects />
        <Roadmap />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
}
