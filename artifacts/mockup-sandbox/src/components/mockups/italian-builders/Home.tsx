import React, { useEffect, useState } from "react";
import "./_group.css";
import { ArrowRight, Code2, Globe, HeartHandshake, Layers, MapPin, MessageSquare, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// --- DUMMY DATA ---

const PROJECTS = [
  {
    id: 1,
    title: "ViteLaunch",
    description: "The fastest way to launch your next SaaS. Boilerplates for ambitious makers.",
    image: "/__mockup/images/project-1.png",
    maker: {
      name: "Marco Rossi",
      avatar: "/__mockup/images/avatar-1.png",
      role: "Full-stack Developer",
    },
    tags: ["SaaS", "Boilerplate", "React"],
  },
  {
    id: 2,
    title: "Aura Habit Tracker",
    description: "A beautiful, minimalist habit tracker that doesn't feel like work.",
    image: "/__mockup/images/project-2.png",
    maker: {
      name: "Sofia Conti",
      avatar: "/__mockup/images/avatar-2.png",
      role: "Product Designer",
    },
    tags: ["Mobile App", "Productivity"],
  },
  {
    id: 3,
    title: "Syntax Flow",
    description: "An AI-powered pair programmer that understands your entire codebase context.",
    image: "/__mockup/images/project-3.png",
    maker: {
      name: "Luca Bianchi",
      avatar: "/__mockup/images/avatar-3.png",
      role: "AI Engineer",
    },
    tags: ["DevTools", "AI"],
  },
  {
    id: 4,
    title: "Kanban sync",
    description: "Offline-first project management for teams that need to move fast.",
    image: "/__mockup/images/project-4.png",
    maker: {
      name: "Elena Romano",
      avatar: "/__mockup/images/avatar-4.png",
      role: "Founder & CEO",
    },
    tags: ["B2B", "Productivity"],
  },
];

// --- COMPONENTS ---

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost" }
>(({ className, variant = "primary", ...props }, ref) => {
  const variants = {
    primary: "bg-[#c25134] text-white hover:bg-[#b0452b] shadow-sm",
    secondary: "bg-[#2c3a32] text-[#f9f7f4] hover:bg-[#222d27] shadow-sm",
    outline: "border border-[#1c1917]/10 bg-transparent hover:bg-[#1c1917]/5 text-[#1c1917]",
    ghost: "bg-transparent hover:bg-[#1c1917]/5 text-[#1c1917]",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c25134] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

// --- SECTIONS ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "ib-glass py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#c25134] flex items-center justify-center text-white font-serif font-bold text-xl leading-none">
            I
          </div>
          <span className="font-semibold text-lg tracking-tight">Italian Builders</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1c1917]/80">
          <a href="#" className="hover:text-[#c25134] transition-colors">Manifesto</a>
          <a href="#" className="hover:text-[#c25134] transition-colors">Members</a>
          <a href="#" className="hover:text-[#c25134] transition-colors">Projects</a>
          <a href="#" className="hover:text-[#c25134] transition-colors">Events</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-[#1c1917] hidden sm:block hover:opacity-70 transition-opacity">
            Sign in
          </a>
          <Button>Apply to join</Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c25134]/10 text-[#c25134] text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c25134] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c25134]"></span>
              </span>
              Now 500+ members strong
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#1c1917] mb-6 leading-[1.1]">
              Crafting digital <br className="hidden md:block" />
              <span className="font-serif italic text-[#c25134] font-normal pr-2">masterpieces</span>
              together.
            </h1>
            <p className="text-lg md:text-xl text-[#78716c] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              We are the tight-knit collective of Italian makers, indie hackers, and founders building the next generation of software products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button className="h-12 px-8 text-base w-full sm:w-auto group">
                Apply to join
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="h-12 px-8 text-base w-full sm:w-auto">
                Explore projects
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    src={`/__mockup/images/avatar-${i}.png`} 
                    alt={`Member ${i}`}
                    className="w-10 h-10 rounded-full border-2 border-[#f9f7f4] object-cover"
                  />
                ))}
              </div>
              <div className="text-sm text-[#78716c]">
                Joined by <strong className="text-[#1c1917]">Marco</strong>, <strong className="text-[#1c1917]">Elena</strong> and 498 others.
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-2xl">
              <img 
                src="/__mockup/images/hero.png" 
                alt="Abstract craftsmanship" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-black/5 rounded-2xl"></div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-black/5 flex items-center gap-4 animate-in fade-in zoom-in duration-700 delay-500">
              <div className="w-12 h-12 bg-[#2c3a32] rounded-full flex items-center justify-center text-white">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1c1917]">Global Reach</p>
                <p className="text-xs text-[#78716c]">Made in Italy, for the world.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueProps() {
  const props = [
    {
      icon: <Users className="w-6 h-6 text-[#c25134]" />,
      title: "Find your people",
      desc: "Connect with 500+ vetted Italian founders and makers who speak your language—literally and technically."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#c25134]" />,
      title: "Showcase your work",
      desc: "A beautiful, premium directory to display your projects, attract early adopters, and build in public."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#c25134]" />,
      title: "Honest feedback",
      desc: "Skip the noise. Get actionable, constructive feedback from builders who have been exactly where you are."
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-[#c25134]" />,
      title: "Real support",
      desc: "From finding co-founders to navigating legal hurdles, tap into a collective brain trust that genuinely cares."
    }
  ];

  return (
    <section className="py-24 bg-white px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">More than a Discord server.</h2>
          <p className="text-lg text-[#78716c]">We built the infrastructure for you to thrive. Everything you need to go from idea to MRR, surrounded by the best.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {props.map((prop, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#f9f7f4]/50 border border-[#1c1917]/5 hover:border-[#c25134]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                {prop.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{prop.title}</h3>
              <p className="text-[#78716c] leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: any; index: number }) {
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-[#1c1917]/5 ib-card-hover flex flex-col"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e6e1d8]">
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          {project.tags.map((tag: string) => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-[#1c1917]">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-[#c25134] transition-colors">{project.title}</h3>
        <p className="text-[#78716c] text-sm mb-6 flex-1">{project.description}</p>
        
        <div className="flex items-center gap-3 pt-4 border-t border-[#1c1917]/5">
          <img 
            src={project.maker.avatar} 
            alt={project.maker.name}
            className="w-10 h-10 rounded-full object-cover border border-[#1c1917]/10"
          />
          <div>
            <p className="text-sm font-semibold text-[#1c1917]">{project.maker.name}</p>
            <p className="text-xs text-[#78716c]">{project.maker.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-[#c25134]/5 blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-[600px] h-[600px] rounded-full bg-[#2c3a32]/5 blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built by the community.</h2>
            <p className="text-lg text-[#78716c]">Discover what our members are shipping. From humble side projects to VC-backed startups.</p>
          </div>
          <Button variant="outline" className="hidden md:flex shrink-0">
            View directory
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PROJECTS.map((project, idx) => (
            <div key={project.id} className={cn("animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both", idx === 3 ? "hidden xl:block" : "")}>
              <ProjectCard project={project} index={idx} />
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
          <Button variant="outline" className="w-full">
            View all projects
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-[#2c3a32] rounded-3xl p-8 md:p-16 text-center md:text-left relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 grid md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="flex flex-col items-center md:items-start pt-8 md:pt-0 first:pt-0">
              <span className="text-5xl lg:text-6xl font-serif text-[#c25134] mb-2">500+</span>
              <span className="text-[#f9f7f4]/80 font-medium">Active Makers</span>
            </div>
            <div className="flex flex-col items-center md:items-start pt-8 md:pt-0 md:pl-12">
              <span className="text-5xl lg:text-6xl font-serif text-[#c25134] mb-2">$2M+</span>
              <span className="text-[#f9f7f4]/80 font-medium">Combined MRR</span>
            </div>
            <div className="flex flex-col items-center md:items-start pt-8 md:pt-0 md:pl-12">
              <span className="text-5xl lg:text-6xl font-serif text-[#c25134] mb-2">1.2k</span>
              <span className="text-[#f9f7f4]/80 font-medium">Projects Shipped</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6 bg-white relative">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-20 h-20 bg-[#c25134]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
          <Layers className="w-10 h-10 text-[#c25134]" />
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Ready to build with <br className="hidden sm:block"/> the best?
        </h2>
        <p className="text-xl text-[#78716c] mb-10 max-w-2xl mx-auto">
          We carefully review every application to ensure a high-signal, zero-noise environment. Join 500+ Italian makers shipping great products.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button className="h-14 px-10 text-lg w-full sm:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Apply for membership
          </Button>
          <span className="text-sm text-[#78716c]">or</span>
          <a href="#" className="text-sm font-semibold hover:text-[#c25134] transition-colors underline underline-offset-4">
            Read our manifesto
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1c1917]/10 bg-white pt-16 pb-8 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-[#1c1917] flex items-center justify-center text-white font-serif font-bold text-sm leading-none">
                I
              </div>
              <span className="font-bold text-lg">Italian Builders</span>
            </div>
            <p className="text-[#78716c] max-w-xs mb-6">
              The premier community for Italian makers, indie hackers, and software founders.
            </p>
            <div className="flex items-center gap-4 text-[#78716c]">
              {/* Dummy social links */}
              <a href="#" className="hover:text-[#1c1917] transition-colors"><div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">X</div></a>
              <a href="#" className="hover:text-[#1c1917] transition-colors"><div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">in</div></a>
              <a href="#" className="hover:text-[#1c1917] transition-colors"><div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">gh</div></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#1c1917]">Community</h4>
            <ul className="space-y-3 text-sm text-[#78716c]">
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Manifesto</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Directory</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Events</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Job Board</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#1c1917]">Resources</h4>
            <ul className="space-y-3 text-sm text-[#78716c]">
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Newsletter</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Tool Stack</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Discounts</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#1c1917]">Legal</h4>
            <ul className="space-y-3 text-sm text-[#78716c]">
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#c25134] transition-colors">Code of Conduct</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#1c1917]/10 text-sm text-[#78716c]">
          <p>© {new Date().getFullYear()} Italian Builders. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            Made with <HeartHandshake className="w-4 h-4 mx-1" /> in Italy
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- MAIN EXPORT ---

export function Home() {
  return (
    <div className="ib-theme">
      <Navbar />
      <main>
        <Hero />
        <ValueProps />
        <Showcase />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
