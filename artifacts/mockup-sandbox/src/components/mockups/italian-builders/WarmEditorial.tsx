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
import "./WarmEditorial.css";

// --- Mock Data ---

const OS_PROJECTS = [
  {
    title: "Italian Builders Directory",
    description: "An open directory to discover active builders, products, and startups in the ecosystem.",
    status: "Coming soon",
    category: "Directory",
    icon: Compass,
    gradient: "from-[#E8E3DB] to-[#FBF9F6]"
  },
  {
    title: "Builder Profile Pages",
    description: "Public pages showcasing your projects, contributions, and builder journey.",
    status: "In discussion",
    category: "Profiles",
    icon: LayoutGrid,
    gradient: "from-[#E8E3DB] to-[#FBF9F6]"
  },
  {
    title: "Project Showcase",
    description: "A centralized hub to launch, hunt, and vote on projects built by the community.",
    status: "Coming soon",
    category: "Showcase",
    icon: Rocket,
    gradient: "from-[#E8E3DB] to-[#FBF9F6]"
  }
];

const BUILDER_PROJECTS = [
  {
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-1.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "BaseLayer",
    category: "DevTools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-3.png",
    avatar: "/__mockup/images/avatar-3.png"
  },
  {
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-4.png",
    avatar: "/__mockup/images/avatar-4.png"
  },
  {
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-5.png",
    avatar: "/__mockup/images/avatar-5.png"
  },
  {
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-6.png",
    avatar: "/__mockup/images/avatar-6.png"
  },
  {
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-7.png",
    avatar: "/__mockup/images/avatar-1.png"
  },
  {
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "text-[#B85C38]",
    image: "/__mockup/images/project-2.png",
    avatar: "/__mockup/images/avatar-2.png"
  },
  {
    name: "DevKit",
    category: "DevTools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "text-[#B85C38]",
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
    <header className="sticky top-0 z-50 w-full bg-[#FBF9F6]/90 backdrop-blur-md border-b border-[#E8E3DB]">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif italic text-2xl tracking-wide text-[#2D2A26]">Italian Builders</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#builders" className="text-[13px] uppercase tracking-widest text-[#5C564D] hover:text-[#B85C38] transition-colors">Builders</a>
          <a href="#projects" className="text-[13px] uppercase tracking-widest text-[#5C564D] hover:text-[#B85C38] transition-colors">Projects</a>
          <a href="#os-projects" className="text-[13px] uppercase tracking-widest text-[#5C564D] hover:text-[#B85C38] transition-colors">Open Source</a>
          <a href="#roadmap" className="text-[13px] uppercase tracking-widest text-[#5C564D] hover:text-[#B85C38] transition-colors">Roadmap</a>
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <a href="#join" className="text-sm font-light text-[#5C564D] hover:text-[#2D2A26]">Sign in</a>
          <a href="#join" className="text-[13px] uppercase tracking-widest font-medium px-6 py-2.5 border border-[#2D2A26] text-[#2D2A26] hover:bg-[#2D2A26] hover:text-[#FBF9F6] transition-colors">
            Join Waitlist
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-[#2D2A26]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E3DB] bg-[#FBF9F6] px-6 py-8 space-y-6">
          <nav className="flex flex-col space-y-4">
            <a href="#builders" className="text-sm uppercase tracking-widest text-[#5C564D]">Builders</a>
            <a href="#projects" className="text-sm uppercase tracking-widest text-[#5C564D]">Projects</a>
            <a href="#os-projects" className="text-sm uppercase tracking-widest text-[#5C564D]">Open Source</a>
            <a href="#roadmap" className="text-sm uppercase tracking-widest text-[#5C564D]">Roadmap</a>
          </nav>
          <div className="pt-6 border-t border-[#E8E3DB] flex flex-col gap-4">
            <a href="#join" className="text-center text-sm font-light text-[#5C564D]">Sign in</a>
            <a href="#join" className="text-center text-[13px] uppercase tracking-widest font-medium px-6 py-3 border border-[#2D2A26] text-[#2D2A26]">
              Join Waitlist
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-10 inline-block">
            <span className="text-xs uppercase tracking-[0.2em] text-[#B85C38] border-b border-[#B85C38] pb-1">
              A Community of Creators
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif text-[#2D2A26] mb-8 leading-[1.1] max-w-4xl">
            Where Italian builders <br className="hidden md:block" /> come to <span className="italic">build in public.</span>
          </h1>
          
          <p className="text-lg md:text-xl font-light text-[#5C564D] max-w-2xl mx-auto mb-16 leading-relaxed">
            An elegant space for artisans of the web—those building apps, tools, open-source projects, and independent businesses from Italy.
          </p>
          
          <div className="w-full max-w-4xl aspect-[16/9] mb-20 relative overflow-hidden">
             <img src="/__mockup/images/warmed-hero.png" alt="Warm Italian Architecture" className="w-full h-full object-cover object-center grayscale-[0.2] contrast-[0.9]" />
             {/* Subdued frame effect */}
             <div className="absolute inset-0 border border-white/20 pointer-events-none mix-blend-overlay m-4"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-8">
             <a href="#join" className="text-[13px] uppercase tracking-widest font-medium px-10 py-4 bg-[#2D2A26] text-[#FBF9F6] hover:bg-[#1a1815] transition-colors">
               Enter the Waitlist
             </a>
             <a href="#projects" className="text-[13px] uppercase tracking-widest font-medium text-[#5C564D] hover:text-[#B85C38] flex items-center gap-2">
               Explore Work <ArrowRight size={14} strokeWidth={1.5} />
             </a>
          </div>
          
          <div className="mt-16 pt-8 border-t border-[#E8E3DB] flex items-center justify-center gap-4 text-sm font-light text-[#5C564D]">
            <div className="flex -space-x-3">
              <img src="/__mockup/images/avatar-1.png" className="w-10 h-10 rounded-full border border-[#FBF9F6]" alt="Builder" />
              <img src="/__mockup/images/avatar-2.png" className="w-10 h-10 rounded-full border border-[#FBF9F6]" alt="Builder" />
              <img src="/__mockup/images/avatar-3.png" className="w-10 h-10 rounded-full border border-[#FBF9F6]" alt="Builder" />
            </div>
            <span className="italic">Joining 500+ esteemed builders.</span>
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
  const todayLabel = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section id="builders" className="py-24 border-t border-[#E8E3DB] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.2em] text-[#B85C38] block mb-4">
              Daily Curated Selection · {todayLabel}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#2D2A26] mb-4">Builder Highlights</h2>
            <p className="text-lg font-light text-[#5C564D] leading-relaxed">
              A rotating spotlight on the individuals shaping the Italian digital landscape.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-12 h-12 flex items-center justify-center border border-[#E8E3DB] text-[#2D2A26] hover:bg-[#E8E3DB]/30 transition-colors rounded-full"
            >
              <ChevronLeft size={18} strokeWidth={1} />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-12 h-12 flex items-center justify-center border border-[#E8E3DB] text-[#2D2A26] hover:bg-[#E8E3DB]/30 transition-colors rounded-full"
            >
              <ChevronRight size={18} strokeWidth={1} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-8"
        >
          {todaysBuilders.map((builder, i) => (
            <div
              key={`${builder.name}-${i}`}
              className="snap-start flex-shrink-0 w-80 flex flex-col group"
            >
              <div className="aspect-square mb-6 overflow-hidden bg-[#E8E3DB]">
                 <img src={builder.avatar} alt={builder.name} className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105" />
              </div>
              
              <div className="mb-4">
                <h3 className="font-serif text-2xl text-[#2D2A26] mb-1">{builder.name}</h3>
                <div className="text-sm font-light text-[#5C564D] flex items-center gap-2">
                  <span>{builder.role}</span>
                  <span className="text-[#E8E3DB]">|</span>
                  <span className="uppercase text-[10px] tracking-widest">{builder.location}</span>
                </div>
              </div>
              
              <p className="text-[#5C564D] font-light leading-relaxed mb-6 italic">
                "{builder.highlight}"
              </p>
              
              <div className="flex gap-3 mb-6">
                {builder.tags.map(tag => (
                   <span key={tag} className="text-[10px] uppercase tracking-widest border-b border-[#E8E3DB] pb-0.5 text-[#8C8273]">
                     {tag}
                   </span>
                ))}
              </div>
              
              <div className="mt-auto pt-4 border-t border-[#E8E3DB]">
                <a href="#profile" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#2D2A26] hover:text-[#B85C38] transition-colors">
                  View Profile <ArrowRight size={12} strokeWidth={1.5} />
                </a>
              </div>
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
    <section id="projects" className="py-32 bg-[#F6F4EF]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs uppercase tracking-[0.2em] text-[#B85C38] block mb-4">
            Showcase
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#2D2A26] mb-6">Selected Works</h2>
          <p className="text-lg font-light text-[#5C564D] max-w-2xl">
            A curated exhibition of applications, platforms, and experiments crafted by the community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-8 mb-16 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`text-[11px] uppercase tracking-widest pb-1 border-b transition-all ${
                active === cat
                  ? "border-[#2D2A26] text-[#2D2A26]"
                  : "border-transparent text-[#8C8273] hover:text-[#2D2A26]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {visible.map((project, i) => (
            <div key={`${project.name}-${i}`} className="group flex flex-col">
              <div className="aspect-[4/3] mb-6 overflow-hidden bg-[#E8E3DB] relative">
                 <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale-[0.1]" />
                 <div className="absolute top-4 left-4">
                    <span className="text-[10px] uppercase tracking-widest bg-white/90 px-3 py-1 text-[#2D2A26]">
                      {project.category}
                    </span>
                 </div>
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-serif text-2xl text-[#2D2A26]">{project.name}</h3>
                <span className={`text-[10px] uppercase tracking-widest ${project.statusColor}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-[#5C564D] font-light leading-relaxed mb-6 flex-grow">
                {project.description}
              </p>
              
              <div className="pt-4 border-t border-[#E8E3DB] flex items-center gap-3">
                <img src={project.avatar} alt={project.builder} className="w-8 h-8 rounded-full grayscale-[0.2]" />
                <span className="text-sm font-light text-[#2D2A26]">{project.builder}</span>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-20 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-[13px] uppercase tracking-widest font-medium px-8 py-3 border border-[#2D2A26] text-[#2D2A26] hover:bg-[#2D2A26] hover:text-[#FBF9F6] transition-colors"
            >
              Discover more works
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function OsProjects() {
  return (
    <section id="os-projects" className="py-32 border-t border-[#E8E3DB]">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
           <span className="text-xs uppercase tracking-[0.2em] text-[#B85C38] block mb-4">
             Community OS
           </span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#2D2A26] mb-6">Shared Infrastructure</h2>
          <p className="text-lg font-light text-[#5C564D]">
            Open-source initiatives designed to strengthen and connect the Italian builder ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {OS_PROJECTS.map((project, i) => (
            <div key={i} className="border border-[#E8E3DB] p-8 flex flex-col hover:border-[#2D2A26] transition-colors group">
              <div className="w-12 h-12 bg-[#F6F4EF] flex items-center justify-center mb-8">
                <project.icon size={20} className="text-[#2D2A26]" strokeWidth={1} />
              </div>
              <h3 className="font-serif text-2xl text-[#2D2A26] mb-4">{project.title}</h3>
              <p className="text-[#5C564D] font-light leading-relaxed mb-8 flex-grow">
                {project.description}
              </p>
              <div className="pt-6 border-t border-[#E8E3DB] flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#B85C38]">{project.status}</span>
                <a href="#" className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2D2A26]">
                  <ArrowRight size={16} strokeWidth={1} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const [votes, setVotes] = useState<Record<number, { count: number, voted: boolean }>>(
    ROADMAP.reduce((acc, curr, i) => ({ ...acc, [i]: { count: curr.votes, voted: false } }), {})
  );

  const handleVote = (index: number) => {
    setVotes(prev => {
      const item = prev[index];
      if (item.voted) return prev;
      return { ...prev, [index]: { count: item.count + 1, voted: true } };
    });
  };

  return (
    <section id="roadmap" className="py-32 bg-[#2D2A26] text-[#FBF9F6]">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-16">
          <span className="text-xs uppercase tracking-[0.2em] text-[#C06E52] block mb-4">
            Direction
          </span>
          <h2 className="text-4xl md:text-5xl font-serif mb-6">A roadmap shaped by you</h2>
          <p className="text-lg font-light text-[#A49D94]">
            Propose features, vote on priorities, and help steer the community's evolution.
          </p>
        </div>

        <div className="space-y-0">
          {ROADMAP.map((item, i) => (
            <div key={i} className="py-8 border-b border-[#4A453E] flex flex-col sm:flex-row sm:items-center gap-6 group">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-serif text-xl sm:text-2xl">{item.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-[#8C8273] border border-[#4A453E] px-2 py-0.5">
                    {item.status}
                  </span>
                </div>
                <p className="text-[#A49D94] font-light">{item.description}</p>
              </div>
              
              <button
                onClick={() => handleVote(i)}
                disabled={votes[i].voted}
                className={`flex sm:flex-col items-center justify-center gap-2 sm:gap-1 sm:w-16 h-12 sm:h-16 shrink-0 border transition-all ${
                  votes[i].voted 
                    ? "border-[#C06E52] text-[#C06E52] cursor-default" 
                    : "border-[#4A453E] text-[#A49D94] hover:border-[#FBF9F6] hover:text-[#FBF9F6]"
                }`}
              >
                <ChevronUp size={16} strokeWidth={votes[i].voted ? 2 : 1} />
                <span className="text-sm font-medium">{votes[i].count}</span>
              </button>
            </div>
          ))}
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
    <section id="join" className="py-32">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Who it's for */}
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#B85C38] block mb-4">
              Membership
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#2D2A26] mb-8">Who is this for?</h2>
            
            <div className="space-y-10">
              {WHO_FOR.map((item, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="mt-1">
                    <item.icon size={20} className="text-[#B85C38]" strokeWidth={1} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#2D2A26] mb-2">{item.title}</h3>
                    <p className="text-[#5C564D] font-light leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-[#F6F4EF] p-8 md:p-12">
            <h3 className="font-serif text-3xl text-[#2D2A26] mb-2">Request an invitation</h3>
            <p className="text-[#5C564D] font-light mb-10">We review applications carefully to maintain the quality of the network.</p>

            {submitted ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#E8E3DB] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} className="text-[#2D2A26]" strokeWidth={1} />
                </div>
                <h4 className="font-serif text-2xl text-[#2D2A26] mb-3">Application Received</h4>
                <p className="text-[#5C564D] font-light">
                  Thank you for your interest. We will be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs uppercase tracking-widest text-[#8C8273]">Name / Handle *</label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Leonardo da Vinci" 
                    className="warm-editorial-input"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs uppercase tracking-widest text-[#8C8273]">Email *</label>
                  <Input 
                    id="email" 
                    required 
                    type="email"
                    placeholder="leonardo@example.com" 
                    className="warm-editorial-input"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-xs uppercase tracking-widest text-[#8C8273]">Primary Role *</label>
                  <Select required>
                    <SelectTrigger id="role" className="warm-editorial-input text-base h-auto py-2">
                      <SelectValue placeholder="Select your focus" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FBF9F6] border-[#E8E3DB] rounded-none shadow-xl">
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role.toLowerCase()} className="focus:bg-[#E8E3DB] focus:text-[#2D2A26] rounded-none">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="building" className="text-xs uppercase tracking-widest text-[#8C8273]">What are you building? <span className="text-[#A49D94] normal-case tracking-normal">(Optional)</span></label>
                  <Input 
                    id="building" 
                    placeholder="A short description, or 'looking for ideas'" 
                    className="warm-editorial-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="twitter" className="text-xs uppercase tracking-widest text-[#8C8273]">X (Twitter)</label>
                    <div className="relative">
                      <Twitter size={14} className="absolute left-0 top-3 text-[#A49D94]" strokeWidth={1.5} />
                      <Input id="twitter" placeholder="@username" className="warm-editorial-input pl-6" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="linkedin" className="text-xs uppercase tracking-widest text-[#8C8273]">LinkedIn</label>
                    <div className="relative">
                      <Linkedin size={14} className="absolute left-0 top-3 text-[#A49D94]" strokeWidth={1.5} />
                      <Input id="linkedin" placeholder="in/username" className="warm-editorial-input pl-6" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="website" className="text-xs uppercase tracking-widest text-[#8C8273]">Personal Website</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-0 top-3 text-[#A49D94]" strokeWidth={1.5} />
                    <Input id="website" type="url" placeholder="https://" className="warm-editorial-input pl-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="project" className="text-xs uppercase tracking-widest text-[#8C8273]">Main Project / Startup URL</label>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute left-0 top-3 text-[#A49D94]" strokeWidth={1.5} />
                    <Input id="project" type="url" placeholder="https://" className="warm-editorial-input pl-6" />
                  </div>
                </div>

                <Button type="submit" className="w-full text-[13px] uppercase tracking-widest font-medium h-14 bg-[#2D2A26] text-[#FBF9F6] hover:bg-[#1a1815] rounded-none">
                  Submit Application
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#2D2A26] text-[#A49D94] py-16 border-t border-[#4A453E]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <span className="font-serif italic text-2xl text-[#FBF9F6] mb-6 block">Italian Builders</span>
            <p className="font-light max-w-sm leading-relaxed">
              Connecting and empowering the Italian maker ecosystem through shared resources, open directories, and peer support.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#C06E52] mb-6">Directory</h4>
            <ul className="space-y-4 font-light">
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Builders</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Projects</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Open Source</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Resources</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#C06E52] mb-6">Community</h4>
            <ul className="space-y-4 font-light">
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Roadmap</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Waitlist</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Guidelines</a></li>
              <li><a href="#" className="hover:text-[#FBF9F6] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#4A453E] flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-light">
          <p>© {new Date().getFullYear()} Italian Builders. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#FBF9F6] transition-colors">X (Twitter)</a>
            <a href="#" className="hover:text-[#FBF9F6] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#FBF9F6] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WarmEditorial() {
  return (
    <div className="warm-editorial min-h-screen">
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
