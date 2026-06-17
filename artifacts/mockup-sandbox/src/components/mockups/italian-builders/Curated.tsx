import React, { useEffect, useRef } from "react";
import "./Curated.css";
import { ArrowRight, ArrowUpRight, Github, Twitter, Link as LinkIcon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// --- DUMMY DATA ---

const MEMBERS = [
  { id: 1, name: "Marco Rossi", role: "Full-stack Dev", city: "Milan", avatar: "/__mockup/images/avatar-1.png", bio: "Building tools for local-first apps." },
  { id: 2, name: "Sofia Conti", role: "Product Designer", city: "Rome", avatar: "/__mockup/images/avatar-2.png", bio: "Obsessed with micro-interactions." },
  { id: 3, name: "Luca Bianchi", role: "AI Engineer", city: "Turin", avatar: "/__mockup/images/avatar-3.png", bio: "Training tiny models on large datasets." },
  { id: 4, name: "Elena Romano", role: "Founder", city: "Florence", avatar: "/__mockup/images/avatar-4.png", bio: "Scaling B2B SaaS from the hills." },
  { id: 5, name: "Andrea Ricci", role: "Systems Eng", city: "Bologna", avatar: "/__mockup/images/avatar-5.png", bio: "Making the cloud run faster." },
  { id: 6, name: "Giulia Greco", role: "Web3 Dev", city: "Naples", avatar: "/__mockup/images/avatar-6.png", bio: "Smart contracts & protocol design." },
];

const AI_PROJECTS = [
  { id: 1, title: "Syntax Flow", desc: "AI-powered pair programmer with full codebase context.", image: "/__mockup/images/project-3.png", maker: "Luca Bianchi", avatar: "/__mockup/images/avatar-3.png" },
  { id: 2, title: "Model Matrix", desc: "Visualizing neural network weights in real-time.", image: "/__mockup/images/project-7.png", maker: "Andrea Ricci", avatar: "/__mockup/images/avatar-5.png" },
  { id: 3, title: "Promptly", desc: "A playground for systematic prompt engineering.", image: "/__mockup/images/project-2.png", maker: "Sofia Conti", avatar: "/__mockup/images/avatar-2.png" },
];

const SAAS_PROJECTS = [
  { id: 4, title: "ViteLaunch", desc: "The fastest way to launch your next SaaS. React boilerplates.", image: "/__mockup/images/project-1.png", maker: "Marco Rossi", avatar: "/__mockup/images/avatar-1.png" },
  { id: 5, title: "Kanban sync", desc: "Offline-first project management for fast-moving teams.", image: "/__mockup/images/project-4.png", maker: "Elena Romano", avatar: "/__mockup/images/avatar-4.png" },
];

const WEB3_PROJECTS = [
  { id: 6, title: "EtherFlow", desc: "Seamless cross-chain liquidity protocol.", image: "/__mockup/images/project-6.png", maker: "Giulia Greco", avatar: "/__mockup/images/avatar-6.png" },
];

const FINTECH_PROJECTS = [
  { id: 7, title: "Aura Finance", desc: "Minimalist banking interface for freelancers.", image: "/__mockup/images/project-5.png", maker: "Sofia Conti", avatar: "/__mockup/images/avatar-2.png" },
];

const RESOURCES = [
  { id: 1, title: "State of Italian Indie Hacking 2024", type: "Report", maker: "Community" },
  { id: 2, title: "Legal Guide: Opening a P.IVA", type: "Guide", maker: "Elena Romano" },
  { id: 3, title: "Fireside Chat: Zero to $10k MRR", type: "Recording", maker: "Marco Rossi" },
  { id: 4, title: "The Design Engineer Playbook", type: "Playbook", maker: "Sofia Conti" },
];

// --- COMPONENTS ---

function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 border-b border-[var(--c-border)]">
      <div className="flex items-center gap-2">
        <span className="font-display italic text-2xl font-bold tracking-tight text-[var(--c-terracotta)]">I.B.</span>
        <span className="font-semibold text-sm tracking-widest uppercase">Italian Builders</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase">
        <a href="#builders" className="hover:text-[var(--c-terracotta)] transition-colors">Builders</a>
        <a href="#projects" className="hover:text-[var(--c-terracotta)] transition-colors">Projects</a>
        <a href="#resources" className="hover:text-[var(--c-terracotta)] transition-colors">Resources</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="btn-editorial hidden md:inline-flex">Join 500+ Members</button>
        <button className="md:hidden">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="py-24 md:py-32 px-6 flex flex-col items-center justify-center text-center relative border-b border-[var(--c-border)]">
      <div className="absolute top-10 left-10 w-32 h-32 bg-[var(--c-terracotta)] rounded-full blur-[80px] opacity-20"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-[var(--c-pine)] rounded-full blur-[100px] opacity-20"></div>
      
      <div className="max-w-4xl z-10">
        <div className="mb-6 flex items-center justify-center">
          <span className="inline-block py-1 px-3 border border-[var(--c-fg)] rounded-full text-xs font-semibold tracking-widest uppercase bg-[var(--c-sand)]">
            A Curated Directory
          </span>
        </div>
        <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] leading-[0.9] tracking-tighter mb-8 font-display">
          The Front Page of <br />
          <span className="italic text-[var(--c-terracotta)]">Italian</span> Tech.
        </h1>
        <p className="text-xl md:text-2xl text-[var(--c-fg)]/70 max-w-2xl mx-auto mb-10 font-light">
          A rotating selection of the best makers, indie hackers, and founders from our 500+ member collective. Updated weekly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="btn-editorial btn-editorial-primary text-lg px-8 py-4 w-full sm:w-auto">
            Apply to Join
          </button>
          <button className="btn-editorial text-lg px-8 py-4 w-full sm:w-auto">
            Explore Directory
          </button>
        </div>
      </div>
    </section>
  );
}

function MarqueeDivider() {
  return (
    <div className="border-b border-[var(--c-border)] bg-[var(--c-pine)] text-[var(--c-bg)] py-3 overflow-hidden flex font-display text-2xl italic tracking-wide">
      <div className="marquee-text flex gap-8">
        <span>CURATED WEEKLY</span>
        <span>•</span>
        <span>500+ MAKERS</span>
        <span>•</span>
        <span>BUILD IN PUBLIC</span>
        <span>•</span>
        <span>CURATED WEEKLY</span>
        <span>•</span>
        <span>500+ MAKERS</span>
        <span>•</span>
        <span>BUILD IN PUBLIC</span>
        <span>•</span>
        <span>CURATED WEEKLY</span>
        <span>•</span>
        <span>500+ MAKERS</span>
        <span>•</span>
        <span>BUILD IN PUBLIC</span>
        <span>•</span>
        <span>CURATED WEEKLY</span>
        <span>•</span>
        <span>500+ MAKERS</span>
        <span>•</span>
        <span>BUILD IN PUBLIC</span>
        <span>•</span>
      </div>
    </div>
  );
}

function BuilderRow() {
  return (
    <section id="builders" className="py-24 border-b border-[var(--c-border)]">
      <div className="px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between max-w-[80rem] mx-auto">
        <div>
          <span className="text-sm font-bold tracking-widest uppercase text-[var(--c-terracotta)] mb-2 block">01 / The People</span>
          <h2 className="text-5xl md:text-6xl font-display">Featured Builders</h2>
        </div>
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-widest uppercase hover:text-[var(--c-terracotta)] transition-colors mt-4 md:mt-0">
          View all members <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      
      <div className="scroller-container">
        {MEMBERS.map((member) => (
          <div key={member.id} className="scroller-item w-[280px] md:w-[320px]">
            <div className="card-editorial p-6 rounded-none h-full flex flex-col">
              <div className="aspect-[3/4] mb-6 overflow-hidden">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-display mb-1">{member.name}</h3>
              <p className="text-sm font-bold tracking-wider uppercase text-[var(--c-terracotta)] mb-4">{member.role} • {member.city}</p>
              <p className="text-[var(--c-fg)]/80 text-sm mb-6 flex-1">{member.bio}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--c-border)]">
                <a href="#" className="text-[var(--c-fg)]/60 hover:text-[var(--c-fg)]"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="text-[var(--c-fg)]/60 hover:text-[var(--c-fg)]"><Github className="w-4 h-4" /></a>
                <a href="#" className="text-[var(--c-fg)]/60 hover:text-[var(--c-fg)]"><LinkIcon className="w-4 h-4" /></a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectRow({ 
  id, 
  title, 
  number, 
  projects 
}: { 
  id: string; 
  title: string; 
  number: string; 
  projects: any[] 
}) {
  return (
    <section id={id} className="py-24 border-b border-[var(--c-border)]">
      <div className="px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between max-w-[80rem] mx-auto">
        <div>
          <span className="text-sm font-bold tracking-widest uppercase text-[var(--c-terracotta)] mb-2 block">{number} / Showcase</span>
          <h2 className="text-5xl md:text-6xl font-display">{title}</h2>
        </div>
      </div>
      
      <div className="scroller-container">
        {projects.map((project) => (
          <div key={project.id} className="scroller-item w-[320px] md:w-[480px]">
            <div className="group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden mb-6 border border-[var(--c-border)] relative">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white text-black rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-display mb-2 group-hover:text-[var(--c-terracotta)] transition-colors">{project.title}</h3>
              <p className="text-[var(--c-fg)]/70 mb-4">{project.desc}</p>
              <div className="flex items-center gap-3">
                <img src={project.avatar} className="w-8 h-8 rounded-full border border-[var(--c-border)] object-cover filter grayscale" alt={project.maker} />
                <span className="text-sm font-semibold tracking-wide uppercase text-[var(--c-fg)]/80">By {project.maker}</span>
              </div>
            </div>
          </div>
        ))}
        {/* Placeholder empty states if few projects to fill row */}
        {projects.length < 3 && (
          <div className="scroller-item w-[320px] md:w-[480px]">
            <div className="aspect-[4/3] border border-dashed border-[var(--c-border)] flex flex-col items-center justify-center text-center p-8 bg-[var(--c-sand)]">
              <span className="font-display italic text-2xl mb-2 text-[var(--c-fg)]/40">More coming soon</span>
              <p className="text-sm text-[var(--c-fg)]/60">We curate new projects weekly from the Telegram channels.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ResourcesRow() {
  return (
    <section id="resources" className="py-24 border-b border-[var(--c-border)] bg-[var(--c-pine)] text-[var(--c-bg)]">
      <div className="px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between max-w-[80rem] mx-auto">
        <div>
          <span className="text-sm font-bold tracking-widest uppercase text-[var(--c-terracotta)] mb-2 block">06 / Knowledge</span>
          <h2 className="text-5xl md:text-6xl font-display text-[var(--c-bg)]">Curated Resources</h2>
        </div>
      </div>
      
      <div className="scroller-container">
        {RESOURCES.map((res) => (
          <div key={res.id} className="scroller-item w-[280px] md:w-[360px]">
            <div className="border border-[var(--c-border)] border-[rgba(255,255,255,0.1)] p-8 h-full flex flex-col hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer group">
              <span className="text-xs font-bold tracking-widest uppercase text-[var(--c-terracotta)] mb-6 block">{res.type}</span>
              <h3 className="text-2xl font-display mb-8 flex-1 group-hover:text-[var(--c-sand)]">{res.title}</h3>
              <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,255,255,0.1)]">
                <span className="text-sm opacity-60">By {res.maker}</span>
                <ArrowUpRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:text-[var(--c-terracotta)] transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="py-32 px-6 flex flex-col items-center text-center">
      <h2 className="text-5xl md:text-7xl font-display mb-6">Build with the <span className="italic text-[var(--c-terracotta)]">Best</span>.</h2>
      <p className="text-xl max-w-2xl mx-auto mb-10 text-[var(--c-fg)]/70">
        Join our private Telegram collective of 500+ Italian founders and makers. 
        Share updates, get feedback, and build in public.
      </p>
      <button className="btn-editorial btn-editorial-primary text-xl px-12 py-5 shadow-[4px_4px_0px_0px_var(--c-fg)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
        Apply for Membership
      </button>
      
      <div className="mt-32 w-full max-w-[80rem] mx-auto border-t border-[var(--c-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-semibold tracking-wider uppercase text-[var(--c-fg)]/60">
        <p>© {new Date().getFullYear()} Italian Builders.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[var(--c-fg)] transition-colors">Manifesto</a>
          <a href="#" className="hover:text-[var(--c-fg)] transition-colors">Twitter</a>
          <a href="#" className="hover:text-[var(--c-fg)] transition-colors">Contact</a>
        </div>
      </div>
    </section>
  );
}

export function Curated() {
  return (
    <div className="ib-curated-theme">
      <div className="noise-overlay"></div>
      <Nav />
      <main>
        <Hero />
        <MarqueeDivider />
        <BuilderRow />
        <ProjectRow id="ai-projects" title="AI & Research" number="02" projects={AI_PROJECTS} />
        <ProjectRow id="saas-projects" title="SaaS & Side Projects" number="03" projects={SAAS_PROJECTS} />
        <ProjectRow id="web3-projects" title="Crypto & Web3" number="04" projects={WEB3_PROJECTS} />
        <ProjectRow id="fintech-projects" title="Fintech" number="05" projects={FINTECH_PROJECTS} />
        <ResourcesRow />
        <FooterCTA />
      </main>
    </div>
  );
}
